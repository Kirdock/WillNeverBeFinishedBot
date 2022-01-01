import { Readable, Writable, WritableOptions } from 'stream';
import { EventEmitter } from 'events';
import { OpusEncoder } from '@discordjs/opus';
import Timeout = NodeJS.Timeout;

type BufferArrayElement = [Buffer, BufferEncoding, number, number]; // chunk, encoding, startTime (time chunk received), endTime (time chunk pushed to array)
type ReadWriteOptions = { length?: number, disableFlush?: boolean } & WritableOptions;

// adjusted version of https://github.com/scramjetorg/rereadable-stream
export class ReplayReadable extends Writable {
    private readonly _highWaterMark: number;
    public readonly _bufArr: BufferArrayElement[];
    private readonly _bufArrLength: number; // max _bufArr length
    private readonly _readableOptions: ReadWriteOptions;
    private _reading: number;
    private hiBufCr: number;
    private loBufCr: number;
    private _waiting: ((error?: Error | null) => void) | null;
    private _ended: Promise<unknown>;
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
        this._encoder = new OpusEncoder(this.sampleRate, this.numChannels)

        this._highWaterMark = adjustedOptions.highWaterMark ?? 32;
        this._bufArrLength = adjustedOptions.length;

        this._reading = 0;
        this._bufArr = [];
        this.hiBufCr = 0;
        this.loBufCr = 0;
        this._waiting = null;
        this._ended = new Promise((res) => this.on('finish', res));
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
        const addTime = Date.now();
        chunk = this.decodeChunk(chunk);
        const startTimeOfChunk = this.getStartTimeOfChunk(chunk, addTime);

        const chunk2 = this.writeSilentBytes(startTimeOfChunk);
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

    private updateBufPosition(bufCr: number): void {
        this.hiBufCr = bufCr > this.hiBufCr ? bufCr : this.hiBufCr;
        this.loBufCr = bufCr > this.loBufCr ? bufCr : this.loBufCr;
        if (this._waiting && this.hiBufCr >= this._bufArrLength - this._highWaterMark) {
            const cb = this._waiting;
            this._waiting = null;
            cb();
        }
    }

    private drop(): void {
        if (this._bufArr.length > this._bufArrLength) {
            this.emit('drop', this._bufArr.splice(0, this._bufArr.length - this._bufArrLength).length);
        }
    }

    public rewind(stopTime: number): Readable {
        return this.tail(-1, stopTime);
    }

    public tail(count: number, stopTime = Date.now()): Readable {
        let end = false;
        this.setMaxListeners(++this._reading + EventEmitter.defaultMaxListeners);
        // @ts-ignore
        const ret: Readable & { bufCr: number } = new Readable({
            ...this._readableOptions,
            read: () => {
                if (ret.bufCr < this._bufArr.length) {
                    while (ret.bufCr < this._bufArr.length) {                 // while there's anything to read
                        const [chunk, encoding, startTime] = this._bufArr[ret.bufCr++];
                        if (startTime > stopTime) { // read everything till endTime
                            end = true;
                            break;
                        }

                        const resp = ret.push(chunk, encoding);               // push to readable
                        if (!resp && !end) { // until there's not willing to read and we're not ended
                            break;
                        }
                    }
                    if (!end) {
                        ret.push(this.writeSilentBytes(stopTime), this._bufArr[0][1]); // add silent time till stopTime
                        ret.bufCr++;
                    }

                    end = true;
                    this.updateBufPosition(ret.bufCr);
                } else if (!end) {
                    this.once('wrote', ret._read);
                }

                if (end) {
                    ret.push(null);
                }
            }
        });

        const listener = (count: number) => {
            ret.bufCr -= count;
            if (ret.bufCr < 0) {
                ret.emit('drop', -ret.bufCr);
                ret.bufCr = 0;
            }
        };
        ret.on('end', () => {
            this.removeListener('drop', listener);
            this.setMaxListeners(--this._reading + EventEmitter.defaultMaxListeners);
        });
        ret.bufCr = count < this._bufArr.length && count > 0 ? this._bufArr.length - count : 0;

        this.on('drop', listener);

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

    private writeSilentBytes(stopTime: number): Buffer | undefined {
        const silentBytes = this.getSilentBytes(stopTime);
        return silentBytes ? Buffer.from(new ArrayBuffer(silentBytes)) : undefined;
    }

    private getSilentBytes(stopTime: number): number {
        const silenceTimeSec = this.getSilentSeconds(stopTime);
        if (silenceTimeSec) {
            const totalSamples = silenceTimeSec * this.sampleRate;
            return totalSamples * this.numChannels * Buffer.BYTES_PER_ELEMENT;
        } else {
            return 0;
        }
    }

    private getSilentSeconds(stopTime: number) {
        const lastElement = this._bufArr[this._bufArr.length - 1];
        if (!lastElement) {
            return 0;
        }
        const endTimeBefore = lastElement[3];
        const silenceTimeSec = ((stopTime - endTimeBefore) / 1_000) - 0.04;  // tolerance of 40ms
        return silenceTimeSec < 0 ? 0 : silenceTimeSec;
    }

    private decodeChunk(chunk: Buffer): Buffer {
        return this._encoder.decode(chunk);
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
