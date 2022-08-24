import { OpusEncoder } from '@discordjs/opus';
import { Readable, Writable, WritableOptions } from 'stream';
import { ReplayReadableUtils } from './replay-readable.utils';
import { ChunkArrayItem, IBufferArrayElement, IEncodingOptions } from '../interfaces/replay-readable';
import Timeout = NodeJS.Timeout;

type ReadWriteOptions = { length?: number } & WritableOptions;

// adjusted version of https://github.com/scramjetorg/rereadable-stream
export class ReplayReadable extends Writable {
    private readonly _highWaterMark: number;
    private readonly _bufArr: IBufferArrayElement[];
    private readonly _bufArrLength: number; // max _bufArr length
    private readonly _readableOptions: ReadWriteOptions;
    private _waiting: ((error?: Error | null) => void) | null;
    private readonly fadeOutInterval: Timeout;
    private readonly _encoder: OpusEncoder;
    private readonly encodingOptions: IEncodingOptions;
    private _startTimeOfNextChunk?: number;

    // lifeTime in milliseconds
    constructor(lifeTime: number, sampleRate: number, numChannels: number, options?: ReadWriteOptions) {
        const adjustedOptions = Object.assign({
            length: 1048576, // 2^20 = 1 MB
            highWaterMark: 32,
            dropInterval: 1e3
        }, options) as WritableOptions & { length: number, highWaterMark: number, dropInterval: number };
        const chunkTimeMs = 20;

        super(adjustedOptions);

        this._readableOptions = adjustedOptions;


        this._encoder = new OpusEncoder(sampleRate, numChannels);
        this.encodingOptions = {
            numChannels,
            sampleRate,
            chunkSize: (chunkTimeMs / 1000) * sampleRate * numChannels * Uint8Array.BYTES_PER_ELEMENT * 2 // 20ms per chunk; I don't know why times 2 but without the time is not correct
        }

        this._highWaterMark = adjustedOptions.highWaterMark ?? 32;
        this._bufArrLength = adjustedOptions.length;

        this._bufArr = [];
        this._waiting = null;
        this.fadeOutInterval = setInterval(() => {
            this.fadeOutCheck(lifeTime);
        }, 5_000); // check every 5 seconds if some chunks timed out
    }

    public get startTimeOfNextChunk(): undefined | number {
        return this._startTimeOfNextChunk;
    }

    public set startTimeOfNextChunk(time: number | undefined) {
        if (this._startTimeOfNextChunk && time) {
            ReplayReadableUtils.syncStream(this._bufArr, this._startTimeOfNextChunk, time, this.encodingOptions)
        }
        this._startTimeOfNextChunk = time;
    }

    public get startTime(): number {
        return this._bufArr[0]?.startTime ?? Date.now();
    }

    public _destroy(error: Error | null, callback: (error?: (Error | null)) => void) {
        clearInterval(this.fadeOutInterval);
        super._destroy(error, callback);
    }

    public _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        // encoding is 'buffer'... whatever...

        const isStart = !!this.startTimeOfNextChunk;
        // TODO: start time of the user in the speaking map is probably the real start time and not the time the chunk is received. So it's probably not startTime - chunkTime
        const addTime = this.getStartTimeOfNextChunk();

        chunk = this.decodeChunk(chunk); // always 1280 bytes; 40 ms or 20 ms
        const startTimeOfChunk = isStart ? addTime : ReplayReadableUtils.getStartTimeOfChunk(chunk, addTime, this.encodingOptions.sampleRate, this.encodingOptions.numChannels);
        const lastStopTime = ReplayReadableUtils.getLastStopTime(this._bufArr);

        if (lastStopTime) {
            const timeMs = lastStopTime - startTimeOfChunk;
            ReplayReadableUtils.addSilentTime(this._bufArr, timeMs, encoding, this.encodingOptions)
        }
        this._bufArr.push({chunk, encoding, startTime: startTimeOfChunk, stopTime: Date.now()});
        this.checkAndDrop(callback);
        this.emit('wrote');
    }

    public _writev(chunks: Array<ChunkArrayItem>, callback: (error?: Error | null) => void) {
        const startTime = Date.now();
        this._bufArr.push(...chunks.map(({chunk, encoding}: ChunkArrayItem) => {
            chunk = this.decodeChunk(chunk);
            const startTimeOfChunk = ReplayReadableUtils.getStartTimeOfChunk(chunk, startTime, this.encodingOptions.sampleRate, this.encodingOptions.numChannels);
            return {chunk, encoding, startTime: startTimeOfChunk, stopTime: Date.now()};
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
                let delayAdded = false;
                for (let i = 0; i < this._bufArr.length; ++i) {
                    const element = this._bufArr[i];

                    if (element.startTime < startTime) { // skipTime
                        continue;
                    } else if (!delayAdded) {
                        // add delay time till start time of user
                        const delayTimeSec = (element.startTime - startTime) / 1_000;
                        if (delayTimeSec > 0) {
                            const buffers = ReplayReadableUtils.secondsToBuffer(delayTimeSec, this.encodingOptions);
                            for (const buffer of buffers) {
                                ret.push(buffer, this._bufArr[0].encoding);
                            }
                        }
                        delayAdded = true;
                    }

                    if (element.startTime > stopTime) { // read everything till endTime
                        break;
                    }

                    const resp = ret.push(element.chunk, element.encoding); // push to readable
                    if (!resp) { // until there's not willing to read
                        break;
                    }
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

    private getStartTimeOfNextChunk(): number {
        const time = this.startTimeOfNextChunk || Date.now();
        this.startTimeOfNextChunk = undefined;
        return time;
    }

    private decodeChunk(chunk: Buffer): Buffer {
        return this._encoder.decode(chunk); // TODO: seems like the noise is either related to decode or it's wrongly received in the first place
    }

    private fadeOutCheck(lifeTime: number): void {
        const newDate = Date.now();
        let dropped;
        for (dropped = 0; dropped < this._bufArr.length && (newDate - this._bufArr[dropped].startTime) > lifeTime; ++dropped) {
        }
        if (dropped) {
            this._bufArr.splice(0, dropped);
            this.emit('drop', dropped);
        }
    }
}
