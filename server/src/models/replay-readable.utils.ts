import { IBufferArrayElement, IEncodingOptions } from '../interfaces/replay-readable';

export namespace ReplayReadableUtils {

    export function addSilentTime(bufArr: IBufferArrayElement[], timeMs: number, encoding: BufferEncoding, options: IEncodingOptions, tolerance = 0.4): void {
        let endTimeBefore = getLastStopTime(bufArr);
        if (timeMs <= 0 || !endTimeBefore) {
            return;
        }
        const silentBuffers = millisecondsToBufferWithTolerance(timeMs, options, tolerance);
        if (!silentBuffers.length) {
            return;
        }
        const step = timeMs / silentBuffers.length;
        for (const chunk of silentBuffers) {
            bufArr.push({chunk, encoding, startTime: endTimeBefore, stopTime: Date.now()});
            endTimeBefore += step; // step instead of this.chunkTimeMs, just to be sure
        }
    }

    export function secondsToBuffer(seconds: number, options: IEncodingOptions): Buffer[] {
        const bytes = secondsToBytes(seconds, options.sampleRate, options.numChannels);
        return bytesToBuffer(bytes, options.chunkSize);
    }

    export function getStartTimeOfChunk(chunk: Buffer, addTime: number, sampleRate: number, numChannels: number): number {
        return addTime - getChunkTimeMs(chunk, sampleRate, numChannels);
    }

    export function syncStream(bufArr: IBufferArrayElement[], chunkStartTimeBefore: number, chunkStartTimeNew: number, encodingOptions: IEncodingOptions): void {
        const timeFromStartToStart = chunkStartTimeNew - chunkStartTimeBefore;
        const recordTime = getRecordTimeTillEnd(bufArr, chunkStartTimeBefore, encodingOptions.sampleRate, encodingOptions.numChannels);
        addSilentTime(bufArr, timeFromStartToStart - recordTime, 'buffer' as BufferEncoding, encodingOptions, 0);
    }

    export function getLastStopTime(bufArr: IBufferArrayElement[]): number | undefined {
        return bufArr[bufArr.length - 1]?.stopTime;
    }

    function bytesToBuffer(bytes: number, chunkSize: number): Buffer[] {
        const silentPerChunk = Math.floor(bytes / chunkSize);
        const buffers: Buffer[] = [];
        for (let i = 0; i < silentPerChunk; ++i) {
            buffers.push(Buffer.alloc(chunkSize));
        }

        return buffers;
    }

    function millisecondsToSecondsWithTolerance(timeMs: number, tolerance = 0.4): number { // tolerance 40ms
        const silenceTimeSec = (timeMs / 1_000) - tolerance;
        return silenceTimeSec < 0 ? 0 : silenceTimeSec;
    }

    function millisecondsToBufferWithTolerance(timeMs: number, options: IEncodingOptions, tolerance?: number): Buffer[] {
        const silentBytes = millisecondsToBytesWithTolerance(timeMs, options.sampleRate, options.numChannels, tolerance);
        return bytesToBuffer(silentBytes, options.chunkSize);
    }

    function millisecondsToBytesWithTolerance(timeMs: number, sampleRate: number, numChannels: number, tolerance?: number): number {
        const silenceTimeSec = millisecondsToSecondsWithTolerance(timeMs, tolerance);
        return secondsToBytes(silenceTimeSec, sampleRate, numChannels);
    }

    function secondsToBytes(silenceTimeSec: number, sampleRate: number, numChannels: number): number {
        const totalSamples = silenceTimeSec * sampleRate;
        return totalSamples * numChannels * Uint8Array.BYTES_PER_ELEMENT * 2; // I don't know why 2, but without it, we only have half of the silent bytes needed
    }

    function getChunkTimeMs(chunk: Buffer, sampleRate: number, numChannels: number): number {
        const bytesPerSample = Uint8Array.BYTES_PER_ELEMENT;
        const totalSamples = chunk.byteLength / bytesPerSample / numChannels;
        return (totalSamples / sampleRate / 2) * 1_000;
    }

    function getRecordTimeTillEnd(bufArr: IBufferArrayElement[], startTime: number, sampleRate: number, numChannels: number): number {
        let found = false;
        return bufArr.reduce((time: number, bufferElement: IBufferArrayElement) => {
            if (!found && bufferElement.startTime === startTime) {
                found = true;
            }
            if (found) {
                time += getChunkTimeMs(bufferElement.chunk, sampleRate, numChannels);
            }
            return time;
        }, 0);
    }
}
