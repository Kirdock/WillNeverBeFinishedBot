import { OpusEncoder } from '@discordjs/opus';
import { Readable, Writable, WritableOptions } from 'stream';
import { ChunkArrayItem, IBufferArrayElement, IEncodingOptions } from '../interfaces/replay-readable';
import { getChunkTimeMs, getLastStopTime, getStartTimeOfChunk, secondsToBuffer, syncStream } from './replay-readable.utils';
import Timeout = NodeJS.Timeout;

type ReadWriteOptions = { length?: number } & WritableOptions;

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
    private _startTimeOfChunkBefore?: number;

    // lifeTime in milliseconds
    constructor(lifeTimeMs: number, sampleRate: number, numChannels: number, options?: ReadWriteOptions) {
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
            this.fadeOutCheck(lifeTimeMs);
        }, 5_000); // check every 5 seconds if some chunks timed out
    }

    public get startTimeOfNextChunk(): undefined | number {
        return this._startTimeOfNextChunk;
    }

    public set startTimeOfNextChunk(time: number | undefined) {
        if (this._startTimeOfChunkBefore && time) {
            syncStream(this._bufArr, this._startTimeOfChunkBefore, time, this.encodingOptions)
        }
        this._startTimeOfNextChunk = this._startTimeOfChunkBefore = time;
    }

    public get startTime(): number {
        return this._bufArr[0]?.startTime ?? Date.now();
    }

    public _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        // encoding is 'buffer'... whatever...

        const isCorrectStartTime = !!this.startTimeOfNextChunk;
        // start time of the user in the speaking map is probably the real start time and not the time the chunk is received. So it's probably not startTime - chunkTime
        const addTime = this.getStartTimeOfNextChunk();

        chunk = this.decodeChunk(chunk); // always 1280 bytes; 40 ms or 20 ms
        const startTimeOfNewChunk = isCorrectStartTime
            ? addTime
            : getLastStopTime(this._bufArr)
            || getStartTimeOfChunk(chunk, addTime, this.encodingOptions.sampleRate, this.encodingOptions.numChannels);
        // if (isCorrectStartTime) {
        //     startTimeOfNewChunk = addTime;
        //     // syncStream takes care of the delay; no need to for further manipulation
        //
        //
        //     // const lastStopTime = getLastStopTime(this._bufArr);
        //     // if (lastStopTime) {
        //     //     const timeMs = startTimeOfNewChunk - lastStopTime;
        //     //     addSilentTime(this._bufArr, timeMs, encoding, this.encodingOptions)
        //     // }
        // } else {
        //     startTimeOfNewChunk =
        //         getLastStopTime(this._bufArr)
        //         || getStartTimeOfChunk(chunk, addTime, this.encodingOptions.sampleRate, this.encodingOptions.numChannels);
        // }
        this._bufArr.push({
            chunk,
            encoding,
            startTime: startTimeOfNewChunk,
            stopTime: startTimeOfNewChunk + getChunkTimeMs(chunk, this.encodingOptions.sampleRate, this.encodingOptions.numChannels)
        });
        this.checkAndDrop(callback);
        this.emit('wrote');
    }

    public _writev(chunks: Array<ChunkArrayItem>, callback: (error?: Error | null) => void) {
        // const startTime = Date.now();
        // this._bufArr.push(...chunks.map(({chunk, encoding}: ChunkArrayItem) => {
        //     chunk = this.decodeChunk(chunk);
        //     const startTimeOfChunk = getStartTimeOfChunk(chunk, startTime, this.encodingOptions.sampleRate, this.encodingOptions.numChannels);
        //     return {chunk, encoding, startTime: startTimeOfChunk, stopTime: Date.now()};
        // }));
        // this.checkAndDrop(callback);
        this.emit('wrote');
    }

    public _destroy(error: Error | null, callback: (error?: (Error | null)) => void) {
        clearInterval(this.fadeOutInterval);
        super._destroy(error, callback);
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

                let i;
                // write delay or skip time
                for (i = 0; i < this._bufArr.length; ++i) {
                    const element = this._bufArr[i];

                    if (element.startTime >= startTime) {
                        // add delay time till start time of user
                        const delayTimeSec = (element.startTime - startTime) / 1_000;
                        if (delayTimeSec > 0) {
                            const buffers = secondsToBuffer(delayTimeSec, this.encodingOptions);
                            for (const buffer of buffers) {
                                ret.push(buffer, this._bufArr[0].encoding);
                            }
                        }
                        break;
                    } // else skipTime
                }

                // continue to write the user stream within the time frame
                for (i; i < this._bufArr.length && this._bufArr[i].startTime < stopTime; ++i) {
                    const element = this._bufArr[i];
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
        const time = this.startTimeOfNextChunk || getLastStopTime(this._bufArr) || Date.now(); // ||  Date.now() instead of getLastStopTime
        this._startTimeOfNextChunk = undefined;
        return time;
    }

    private decodeChunk(chunk: Buffer): Buffer {
        return this._encoder.decode(chunk); // TODO: seems like the noise is either related to decode or it's wrongly received in the first place
    }

    private fadeOutCheck(lifeTime: number): void {
        const newDate = Date.now();
        let dropped = 0;
        while (dropped < this._bufArr.length && (newDate - this._bufArr[dropped].startTime) > lifeTime) {
            ++dropped
        }
        if (dropped) {
            this._bufArr.splice(0, dropped);
            this.emit('drop', dropped);
        }
    }
}
