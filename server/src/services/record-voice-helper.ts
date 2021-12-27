import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';
import { OpusEncoder } from '@discordjs/opus';
import { Logger } from './logger';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Transform, TransformCallback, TransformOptions } from 'stream';
import { ReadStream } from 'fs';
import { join } from 'path';
import { FileHelper } from './fileHelper';
import { FileWriter } from 'wav';
import { ReReadable } from '../models/re-readable-custom';

interface UserStreams {
    [userId: string]: ReReadable;
}

export class RecordVoiceHelper {
    private readonly maxRecordTimeMs = 10 * 60 * 1000; // 10 minutes
    private readonly channelCount = 1;
    private readonly sampleRate = 16_000;
    private readonly writeStreams: {
        [serverId: string]: UserStreams
    } = {};

    constructor(private logger: Logger, private readonly fileHelper: FileHelper) {
    }

    public record(connection: VoiceConnection): void {
        connection.receiver.speaking.on('start', (userId: string) => {
            this.writeStreams[connection.joinConfig.guildId] ??= {};
            //check if already listening
            if (!this.writeStreams[connection.joinConfig.guildId][userId]) {
                const encoder = new OpusEncoder(this.sampleRate, this.channelCount);
                const opusStream = connection.receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: this.maxRecordTimeMs,
                    },
                }) as unknown as ReadStream;
                const out = new ReReadable(this.maxRecordTimeMs);
                opusStream.on('end', () => {
                    delete this.writeStreams[connection.joinConfig.guildId][userId];
                });
                opusStream.on('error', async (error: Error) => {
                    this.logger.error(error, 'Error while recording voice');
                    delete this.writeStreams[connection.joinConfig.guildId][userId];
                });

                opusStream
                    .pipe(new OpusDecodingStream({}, encoder)) // max 100 MB
                    .pipe(out);

                this.writeStreams[connection.joinConfig.guildId][userId] = out;
            }
        });
    }

    public async getRecordedVoice(serverId: Snowflake, minutes: number): Promise<string | undefined> {
        return new Promise(async (resolve, reject) => {
            const endTime = Date.now();
            const minStartTime = this.getMinStartTime(serverId);

            if (minStartTime) {
                const {command, createdFiles} = await this.getFfmpegSpecs(this.writeStreams[serverId], minStartTime, endTime, minutes);
                if (createdFiles.length) {
                    const resultPath = join(FileHelper.recordingsDir, `${endTime}.wav`);
                    command.map('[a]')
                        .on('end', async () => {
                            await this.fileHelper.deleteFilesByPath(createdFiles);
                            resolve(resultPath);
                        })
                        .on('error', reject)
                        .saveToFile(resultPath)
                } else {
                    resolve(undefined);
                }
            } else {
                resolve(undefined);
            }
        });
    }

    private getMinStartTime(serverId: string): number | undefined {
        let minStartTime: number | undefined;
        for (const userId in this.writeStreams[serverId]) {
            const stream = this.writeStreams[serverId][userId];
            if (!minStartTime || (stream.startTime && stream.startTime < minStartTime)) {
                minStartTime = stream.startTime;
            }
        }
        return minStartTime;
    }

    private async getFfmpegSpecs(streams: UserStreams, minStartTime: number, endTime: number, minutes: number) {
        const maxRecordTime = endTime - minutes * 60 * 1000;
        const startRecordTime = Math.max(minStartTime, maxRecordTime);
        const maxDuration = endTime - startRecordTime; // duration of the longest user recording
        let ffmpegOptions = ffmpeg();
        let userCount = 0;
        let amixString = '';
        const delayStrings: string[] = [];
        const createdFiles: string[] = [];

        for (const userId in streams) {
            const stream = streams[userId];
            const filePath = join(FileHelper.recordingsDir, `${endTime}-${userId}.wav`);
            try {
                const startTimeOfFile = stream.startTime;
                const skipTime = startRecordTime - (startTimeOfFile ?? 0);
                await this.saveFile(stream, filePath);
                const duration = await this.getFileDuration(filePath);
                let delay = maxDuration - duration;
                delay = delay < 0 ? 0 : delay;

                createdFiles.push(filePath);
                ffmpegOptions = ffmpegOptions.addInput(filePath);
                if (skipTime > 0) {
                    ffmpegOptions = ffmpegOptions.seekInput(skipTime / 1000);
                }
                delayStrings.push(`[${userCount}]adelay=${delay}|${delay}[a${userCount}]`);
                amixString = `${amixString}[a${userCount}]`;
                ++userCount;
            } catch (e) {
                this.logger.error(e, 'Error while saving user recording');
            }
        }

        return {
            command: ffmpegOptions.complexFilter([
                ...delayStrings,
                {
                    filter: `amix=inputs=${userCount}[a]`,
                    inputs: `${amixString}`,
                }
            ]),
            createdFiles
        }
    }

    private async getFileDuration(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err: Error, metadata: FfprobeData) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(metadata.format.duration ?? 0);
                }
            })
        })
    }

    private async saveFile(stream: ReReadable, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = new FileWriter(filePath, {
                channels: this.channelCount,
                sampleRate: this.sampleRate
            });

            const bytesBefore = stream._bufArr.reduce((bytes, [buffer]: [Buffer, string, number]) => {
                return bytes + buffer.byteLength;
            }, 0);
            const readStream = stream.rewind();

            // the writeStream should end, when the "required" bytes (till the user clicked "download recording") are written
            const interval = setInterval(() => {
                if (writeStream.bytesProcessed >= bytesBefore) {
                    readStream.unpipe(writeStream);
                    writeStream.end();
                    clearInterval(interval);
                }
            }, 100);

            readStream.pipe(writeStream);

            writeStream.on('done', () => {
                resolve();
            });
            writeStream.on('error', (error: Error) => {
                this.logger.error(error, 'Error while saving user recording');
                reject(error);
            });
        });
    }
}

class OpusDecodingStream extends Transform {
    private encoder: OpusEncoder;

    constructor(options: TransformOptions, encoder: OpusEncoder) {
        super(options);
        this.encoder = encoder;
    }

    _transform(data: unknown, encoding: BufferEncoding, callback: TransformCallback) {
        if (data instanceof Buffer) {
            this.push(this.encoder.decode(data));
        }
        callback();
    }
}