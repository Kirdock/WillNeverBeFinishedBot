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
import { IEnvironmentVariables } from '../interfaces/environment-variables';

interface UserStreams {
    [userId: string]: {
        source: ReadStream,
        out: ReReadable,
    };
}

export class RecordVoiceHelper {
    private readonly maxRecordTimeMs; // 10 minutes
    private readonly channelCount = 1;
    private readonly sampleRate = 16_000;
    private writeStreams: {
        [serverId: string]: {
            userStreams: UserStreams,
            listener: (userId: string) => void;
        }
    } = {};

    constructor(private logger: Logger, private readonly fileHelper: FileHelper, config: IEnvironmentVariables) {
        const recordTime = +config.MAX_RECORD_TIME_MINUTES;
        this.maxRecordTimeMs = (!recordTime || isNaN(recordTime) ? 10 : Math.abs(recordTime)) * 60 * 1_000;
    }

    public startRecording(connection: VoiceConnection): void {
        const serverId = connection.joinConfig.guildId;
        if (!this.writeStreams[serverId]) {
            const listener = (userId: string) => {
                //check if already listening
                if (!this.writeStreams[serverId].userStreams[userId]) {
                    const encoder = new OpusEncoder(this.sampleRate, this.channelCount);
                    const out = new ReReadable(this.maxRecordTimeMs);
                    const opusStream = connection.receiver.subscribe(userId, {
                        end: {
                            behavior: EndBehaviorType.AfterSilence,
                            duration: this.maxRecordTimeMs,
                        },
                    }) as unknown as ReadStream;

                    opusStream.on('end', () => {
                        delete this.writeStreams[serverId].userStreams[userId];
                    });
                    opusStream.on('error', (error: Error) => {
                        this.logger.error(error, 'Error while recording voice');
                        delete this.writeStreams[serverId].userStreams[userId];
                    });

                    opusStream
                        .pipe(new OpusDecodingStream({}, encoder))
                        .pipe(out);

                    this.writeStreams[serverId].userStreams[userId] = {
                        source: opusStream,
                        out
                    };
                }
            }
            this.writeStreams[serverId] = {
                userStreams: {},
                listener,
            };
            connection.receiver.speaking.on('start', listener);
        }
    }

    public stopRecording(connection: VoiceConnection): void {
        const serverId = connection.joinConfig.guildId;
        const serverStreams = this.writeStreams[serverId];
        connection.receiver.speaking.removeListener('start', serverStreams.listener);

        for (const userId in serverStreams.userStreams) {
            const userStream = serverStreams.userStreams[userId];
            userStream.source.destroy();
            userStream.out.destroy();
        }
        delete this.writeStreams[serverId];
    }

    public async getRecordedVoice(serverId: Snowflake, minutes: number = 10): Promise<string | undefined> {
        const recordTimeMs = Math.min(Math.abs(minutes) * 60 * 1_000, this.maxRecordTimeMs)
        return new Promise(async (resolve, reject) => {
            const endTime = Date.now();
            const minStartTime = this.getMinStartTime(serverId);

            if (minStartTime) {
                const {command, createdFiles} = await this.getFfmpegSpecs(this.writeStreams[serverId].userStreams, minStartTime, endTime, recordTimeMs);
                if (createdFiles.length) {
                    const resultPath = join(FileHelper.recordingsDir, `${endTime}.wav`);
                    command
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
        for (const userId in this.writeStreams[serverId].userStreams) {
            const stream = this.writeStreams[serverId].userStreams[userId];
            const startTime = stream.out.startTime;

            if (!minStartTime || (startTime && startTime < minStartTime)) {
                minStartTime = startTime;
            }
        }
        return minStartTime;
    }

    private async getFfmpegSpecs(streams: UserStreams, minStartTime: number, endTime: number, recordTimeMs: number) {
        const maxRecordTime = endTime - recordTimeMs;
        const startRecordTime = Math.max(minStartTime, maxRecordTime);
        const maxDuration = endTime - startRecordTime; // duration of the longest user recording
        let ffmpegOptions = ffmpeg();
        let amixString = '';
        const delayStrings: string[] = [];
        const createdFiles: string[] = [];

        for (const userId in streams) {
            const stream = streams[userId];
            const filePath = join(FileHelper.recordingsDir, `${endTime}-${userId}.wav`);
            try {
                const startTimeOfFile = stream.out.startTime;
                const skipTime = startRecordTime - (startTimeOfFile ?? 0);
                await this.saveFile(stream.out, filePath);
                const duration = await this.getFileDuration(filePath);
                let delay = maxDuration - duration;
                delay = delay < 0 ? 0 : delay;
                ffmpegOptions = ffmpegOptions.addInput(filePath);

                if (skipTime > 0) {
                    ffmpegOptions = ffmpegOptions.seekInput(skipTime / 1000);
                }

                amixString += `[a${delayStrings.length}]`;
                delayStrings.push(`[${delayStrings.length}]adelay=${delay}|${delay}[a${delayStrings.length}]`);
                createdFiles.push(filePath);
            } catch (e) {
                this.logger.error(e, 'Error while saving user recording');
            }
        }

        return {
            command: ffmpegOptions.complexFilter([
                ...delayStrings,
                {
                    filter: `amix=inputs=${delayStrings.length}[a]`,
                    inputs: `${amixString}`,
                }
            ]).map('[a]'),
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

            const bytesBefore = stream.byteLength;
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