import { Readable, Writable, WritableOptions } from 'stream';
import { EventEmitter } from 'events';
import { OpusEncoder } from '@discordjs/opus';
import Timeout = NodeJS.Timeout;

// adjusted version of https://github.com/scramjetorg/rereadable-stream
export class ReReadable extends Writable {
    private _highWaterMark: number;
    public _bufArr: [Buffer, BufferEncoding, number][];
    private _bufArrLength: number; // max _bufArr length
    private _readableOptions: { length?: number } & WritableOptions;
    private _reading: number;
    private hiBufCr: number;
    private loBufCr: number;
    private _waiting: ((error?: Error | null) => void) | null;
    private _ended: Promise<unknown>;
    private fadeOutInterval: Timeout;
    private numChannels: number;
    private sampleRate: number;
    private _startTime: number | undefined;
    private _encoder: OpusEncoder;

    // lifeTime in milliseconds
    constructor(lifeTime: number, sampleRate: number, numChannels: number, options?: { length?: number } & WritableOptions) {
        const adjustedOptions = Object.assign({
            length: 1048576,
            highWaterMark: 32,
            dropInterval: 1e3
        }, options) as WritableOptions & { length: number, highWaterMark: number, dropInterval: number };

        super(adjustedOptions);

        this._readableOptions = adjustedOptions;
        this.numChannels = numChannels;
        this.sampleRate = sampleRate;
        this._startTime = Date.now();
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

    get byteLength(): number {
        return this._bufArr.reduce((bytes, [buffer]: [Buffer, string, number]) => {
            return bytes + buffer.byteLength;
        }, 0);
    }

    get startTime(): number {
        return this._startTime ?? this._bufArr[0]?.[2] ?? Date.now();
    }

    _destroy(error: Error | null, callback: (error?: (Error | null)) => void) {
        clearInterval(this.fadeOutInterval);
        super._destroy(error, callback);
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void, isSilent = false) {
        const startTime = Date.now();
        if (!isSilent) {
            chunk = this.decodeChunk(chunk);
        }
        const addChunk = () => {
            this._bufArr.push([chunk, encoding, this.getStartTimeOfChunk(chunk, startTime)]);
            if (this._bufArr.length > this._bufArrLength) {
                this._waiting = callback;
                this.drop();
            } else {
                callback();
            }
            this.emit('wrote');
        }
        if (!isSilent) {
            this.writeSilentBytes(startTime, encoding, addChunk);
        } else {
            addChunk();
        }
    }

    private writeSilentBytes(startTime: number, encoding: BufferEncoding, callback: () => void): void {
        const silentBytes = this.getSilentBytes(startTime);
        if (silentBytes) {
            const buffer = new ArrayBuffer(silentBytes);
            this._write(Buffer.from(buffer), encoding, callback, true);
        } else {
            callback();
        }
    }

    private getSilentBytes(startTime: number): number {
        const lastElement = this._bufArr[this._bufArr.length - 1];
        if (!lastElement) {
            return 0;
        }
        const chunkBefore = lastElement[0];
        const timeBefore = lastElement[2];
        const silenceTimeSec = (startTime - (timeBefore + this.getChunkTimeMs(chunkBefore))) / 1_000;
        if (silenceTimeSec < 0.04) { // tolerance of 40ms
            return 0;
        }
        const totalSamples = silenceTimeSec * this.sampleRate;
        return totalSamples * this.numChannels * Buffer.BYTES_PER_ELEMENT;
    }

    _writev(chunks: Array<{ chunk: Buffer, encoding: BufferEncoding }>, callback: (error?: Error | null) => void) {
        const startTime = Date.now();
        this._bufArr.push(...chunks.map(({chunk, encoding}: { chunk: Buffer, encoding: BufferEncoding }) => {
            chunk = this.decodeChunk(chunk);
            return [chunk, encoding, this.getStartTimeOfChunk(chunk, startTime)] as [Buffer, BufferEncoding, number];
        }));
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
        this.emit('wrote');
    }

    private decodeChunk(chunk: Buffer): Buffer {
        return this._encoder.decode(chunk);
    }

    private getStartTimeOfChunk(chunk: Buffer, startTime: number): number {
        return startTime - this.getChunkTimeMs(chunk);
    }

    private getChunkTimeMs(chunk: Buffer): number {
        const bytesPerSample = Buffer.BYTES_PER_ELEMENT;
        const totalSamples = chunk.byteLength / bytesPerSample / this.numChannels;
        return (totalSamples / this.sampleRate) * 1_000;
    }

    updateBufPosition(bufCr: number) {
        this.hiBufCr = bufCr > this.hiBufCr ? bufCr : this.hiBufCr;
        this.loBufCr = bufCr > this.loBufCr ? bufCr : this.loBufCr;
        if (this._waiting && this.hiBufCr >= this._bufArrLength - this._highWaterMark) {
            const cb = this._waiting;
            this._waiting = null;
            cb();
        }
    }

    drop() {
        if (this._bufArr.length > this._bufArrLength)
            this.emit('drop', this._bufArr.splice(0, this._bufArr.length - this._bufArrLength).length);
    }

    rewind() {
        return this.tail(-1);
    }

    tail(count: number) {
        let end = false;
        // @ts-ignore
        this._ended.then(() => ret._read(end = true));
        this.setMaxListeners(++this._reading + EventEmitter.defaultMaxListeners);
        // @ts-ignore
        const ret: Readable & { bufCr: number } = new Readable(Object.assign(this._readableOptions, {
            read: () => {
                if (ret.bufCr < this._bufArr.length) {
                    while (ret.bufCr < this._bufArr.length) {                 // while there's anything to read
                        // @ts-ignore
                        const resp = ret.push(...this._bufArr[ret.bufCr++]); // push to readable
                        if (!resp && !end) break;                            // until there's not willing to read and we're not ended
                    }
                    this.updateBufPosition(ret.bufCr);
                } else if (!end) {
                    this.once('wrote', ret._read);
                }

                if (end)
                    ret.push(null);
            }
        }));

        ret.bufCr = count < this._bufArr.length && count > 0 ? this._bufArr.length - count : 0;

        this.on('drop', (count) => {
            this._startTime = this._bufArr[0]?.[2];
            ret.bufCr -= count;
            if (ret.bufCr < 0) {
                ret.emit('drop', -ret.bufCr);
                ret.bufCr = 0;
            }
        });

        return ret;
    }
}
