import { Readable, Writable, WritableOptions } from 'stream';
import { OpusEncoder } from '@discordjs/opus';
import Timeout = NodeJS.Timeout;

type BufferArrayElement = [Buffer, BufferEncoding, number, number]; // chunk, encoding, startTime (time chunk received), endTime (time chunk pushed to array)
type ReadWriteOptions = { length?: number } & WritableOptions;

// adjusted version of https://github.com/scramjetorg/rereadable-stream
export class ReplayReadable extends Writable {
    private readonly _highWaterMark: number;
    public readonly _bufArr: BufferArrayElement[];
    private readonly _bufArrLength: number; // max _bufArr length
    private readonly _readableOptions: ReadWriteOptions;
    private _waiting: ((error?: Error | null) => void) | null;
    private readonly fadeOutInterval: Timeout;
    private readonly numChannels: number;
    private readonly sampleRate: number;
    private _encoder: OpusEncoder;

    // lifeTime in milliseconds
    constructor(lifeTime: number, sampleRate: number, numChannels: number, options?: ReadWriteOptions) {
        const adjustedOptions = Object.assign({
            length: 1048576, // 2^20 = 1 MB
            highWaterMark: 32,
            dropInterval: 1e3
        }, options) as WritableOptions & { length: number, highWaterMark: number, dropInterval: number };

        super(adjustedOptions);

        this._readableOptions = adjustedOptions;
        this.numChannels = numChannels;
        this.sampleRate = sampleRate;
        this._encoder = new OpusEncoder(this.sampleRate, this.numChannels);

        this._highWaterMark = adjustedOptions.highWaterMark ?? 32;
        this._bufArrLength = adjustedOptions.length;

        this._bufArr = [];
        this._waiting = null;
        this.fadeOutInterval = setInterval(() => {
            const newDate = Date.now();

            let dropped;
            for (dropped = 0; dropped < this._bufArr.length && (newDate - this._bufArr[dropped][2]) > lifeTime; ++dropped) {
            }
            if (dropped) {
                this._bufArr.splice(0, dropped);
                this.emit('drop', dropped);
            }
        }, 5_000); // check every 5 seconds if some chunks timed out
    }

    public get startTime(): number {
        return this._bufArr[0]?.[2] ?? Date.now();
    }

    public _destroy(error: Error | null, callback: (error?: (Error | null)) => void) {
        clearInterval(this.fadeOutInterval);
        super._destroy(error, callback);
    }

    public _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        // encoding is 'buffer'... whatever...
        const addTime = Date.now();
        chunk = this.decodeChunk(chunk);
        const startTimeOfChunk = this.getStartTimeOfChunk(chunk, addTime);

        const chunk2 = this.getSilentBuffer(startTimeOfChunk);
        if (chunk2) {
            this._bufArr.push([chunk2, encoding, this._bufArr[this._bufArr.length - 1][3], Date.now()]);
        }
        this._bufArr.push([chunk, encoding, startTimeOfChunk, Date.now()]);
        this.checkAndDrop(callback);
        this.emit('wrote');
    }

    public _writev(chunks: Array<{ chunk: Buffer, encoding: BufferEncoding }>, callback: (error?: Error | null) => void) {
        const startTime = Date.now();
        this._bufArr.push(...chunks.map(({chunk, encoding}: { chunk: Buffer, encoding: BufferEncoding }) => {
            chunk = this.decodeChunk(chunk);
            return [chunk, encoding, this.getStartTimeOfChunk(chunk, startTime), Date.now()] as BufferArrayElement;
        }));
        this.checkAndDrop(callback);
        this.emit('wrote');
    }

    private drop(): void {
        if (this._bufArr.length > this._bufArrLength) {
            this.emit('drop', this._bufArr.splice(0, this._bufArr.length - this._bufArrLength).length);
        }
    }

    public rewind(startTime: number, stopTime: number): Readable {
        return this.tail(startTime, stopTime);
    }

    public tail(startTime: number, stopTime: number): Readable {
        const ret: Readable = new Readable({
            highWaterMark: this._readableOptions.highWaterMark,
            read: () => {
                let lastIndex = 0;
                let firstValidStartTime = 0;
                for (let i = 0; i < this._bufArr.length; ++i) {
                    const [chunk, encoding, chunkStartTime] = this._bufArr[i];

                    if (chunkStartTime < startTime) { // skipTime
                        continue;
                    } else if (!firstValidStartTime) {
                        firstValidStartTime = chunkStartTime;
                    }

                    if (chunkStartTime > stopTime) { // read everything till endTime
                        break;
                    }
                    lastIndex = i;

                    const resp = ret.push(chunk, encoding); // push to readable
                    if (!resp) { // until there's not willing to read
                        break;
                    }
                }

                const delayTimeSec = (firstValidStartTime - startTime) / 1_000;
                if (delayTimeSec > 0) {
                    // add delay time till start time of user
                    const buffer = this.getSilentBuffer(delayTimeSec, true);
                    if (buffer) {
                        ret.unshift(buffer, this._bufArr[0][1]);
                    }
                }

                const silentBuffer = this.getSilentBuffer(stopTime, false, lastIndex);
                if (silentBuffer) {
                    ret.push(silentBuffer, this._bufArr[0][1]); // add silent time till stopTime
                }

                ret.push(null);
            }
        });

        return ret;
    }

    private checkAndDrop(callback: (error?: Error | null) => void): void {
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
    }

    private getSilentBuffer(stopTime: number, isSeconds = false, atIndex?: number): Buffer | undefined {
        const silentBytes = this.getSilentBytes(stopTime, isSeconds, atIndex);
        return silentBytes ? Buffer.alloc(silentBytes) : undefined;
    }

    /**
     *
     * @param stopTime Either the stopTime in ms or the amount of seconds
     * @param isSeconds
     * @param atIndex Position in the arrayBuffer that should be compared to
     * @private
     */
    private getSilentBytes(stopTime: number, isSeconds = false, atIndex?: number): number {
        const silenceTimeSec = isSeconds ? stopTime : this.getSilentSeconds(stopTime, atIndex);
        if (silenceTimeSec) {
            const totalSamples = silenceTimeSec * this.sampleRate;
            return totalSamples * this.numChannels * Buffer.BYTES_PER_ELEMENT * 2; // I don't know why 2, but without it, we only have half of the silent bytes needed
        } else {
            return 0;
        }
    }

    private getSilentSeconds(stopTime: number, index = this._bufArr.length - 1) {
        const lastElement = this._bufArr[index];
        if (!lastElement) {
            return 0;
        }
        const endTimeBefore = lastElement[3];
        const silenceTimeSec = (stopTime - endTimeBefore) / 1_000;
        return (silenceTimeSec - 0.04) < 0 ? 0 : silenceTimeSec; // ignore if silent time is less than 40ms
    }

    private decodeChunk(chunk: Buffer): Buffer {
        return this._encoder.decode(chunk); // TODO: seems like the noise is either related to decode or it's wrongly received in the first place
    }

    private getStartTimeOfChunk(chunk: Buffer, addTime: number): number {
        return addTime - this.getChunkTimeMs(chunk);
    }

    private getChunkTimeMs(chunk: Buffer): number {
        const bytesPerSample = Buffer.BYTES_PER_ELEMENT;
        const totalSamples = chunk.byteLength / bytesPerSample / this.numChannels;
        return (totalSamples / this.sampleRate) * 1_000;
    }
}
