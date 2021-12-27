import { Readable, Writable, WritableOptions } from 'stream';
import { EventEmitter } from 'events';
import Timeout = NodeJS.Timeout;

// adjusted version of https://github.com/scramjetorg/rereadable-stream
export class ReReadable extends Writable {
    private _highWaterMark: number;
    public _bufArr: [Buffer, BufferEncoding, number][];
    private _bufArrLength: number; // max _bufArr length
    private _readableOptions: { length: number } & WritableOptions;
    private _reading: number;
    private hiBufCr: number;
    private loBufCr: number;
    private _waiting: ((error?: Error | null) => void) | null;
    private _ended: Promise<unknown>;
    private fadeOutInterval: Timeout;

    // lifeTime in milliseconds
    constructor(lifeTime: number, options?: { length: number } & WritableOptions) {
        options = Object.assign({
            length: 1048576,
            highWaterMark: 32,
            dropInterval: 1e3
        }, options);

        super(options);

        this._readableOptions = options;

        this._highWaterMark = options.highWaterMark ?? 32;
        this._bufArrLength = options.length;

        this._reading = 0;
        this._bufArr = [];
        this.hiBufCr = 0;
        this.loBufCr = 0;
        this._waiting = null;
        this._ended = new Promise((res) => this.on("finish", res));
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

    get startTime(): number | undefined {
        return this._bufArr[0]?.[2];
    }

    _destroy(error: Error | null, callback: (error?: (Error | null)) => void) {
        clearInterval(this.fadeOutInterval);
        super._destroy(error, callback);
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        this._bufArr.push([chunk, encoding, Date.now()]);
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
        this.emit('wrote');
    }

    _writev(chunks: Array<{ chunk: Buffer, encoding: BufferEncoding }>, callback: (error?: Error | null) => void) {
        this._bufArr.push(...chunks.map(({chunk, encoding}: { chunk: Buffer, encoding: BufferEncoding }) => [chunk, encoding, Date.now()] as [Buffer, BufferEncoding, number]));
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback;
            this.drop();
        } else {
            callback();
        }
        this.emit('wrote');
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
            ret.bufCr -= count;
            if (ret.bufCr < 0) {
                ret.emit('drop', -ret.bufCr);
                ret.bufCr = 0;
            }
        });

        return ret;
    }
}
