export interface ChunkArrayItem {
    chunk: Buffer;
    encoding: BufferEncoding
}

export interface IBufferArrayElement {
    chunk: Buffer;
    encoding: BufferEncoding;
    startTime: number;
    stopTime: number
}

export interface IEncodingOptions {
    chunkSize: number;
    sampleRate: number;
    numChannels: number;
}
