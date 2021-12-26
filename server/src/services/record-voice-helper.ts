import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';
import { OpusEncoder } from '@discordjs/opus';
import { Logger } from './logger';
import ffmpeg from 'fluent-ffmpeg';
import { ReReadable } from 'rereadable-stream';
import { Transform, TransformCallback, TransformOptions } from 'stream';
import { ReadStream } from 'fs';
import { join } from 'path';
import { FileHelper } from './fileHelper';
import { FileWriter } from 'wav';

interface UserStreams {
    [userId: string]: {
        startTime: number,
        stream: ReReadable
    }
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
                const date = Date.now();
                const opusStream = connection.receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: this.maxRecordTimeMs,
                    },
                }) as unknown as ReadStream;
                const out = new ReReadable();
                opusStream.on('end', () => {
                    delete this.writeStreams[connection.joinConfig.guildId][userId];
                });
                opusStream.on('error', async (error: Error) => {
                    this.logger.error(error, 'Error while recording voice');
                    delete this.writeStreams[connection.joinConfig.guildId][userId];
                });

                opusStream
                    .pipe(new OpusDecodingStream({highWaterMark: 100 * 1024 * 1024}, encoder))
                    .pipe(out);

                this.writeStreams[connection.joinConfig.guildId][userId] = {
                    startTime: date,
                    stream: out
                };
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
            const user = this.writeStreams[serverId][userId];
            if (!minStartTime || user.startTime < minStartTime) {
                minStartTime = user.startTime;
            }
        }
        return minStartTime;
    }

    private async getFfmpegSpecs(streams: UserStreams, minStartTime: number, endTime: number, minutes: number) {
        const maxRecordTime = endTime - minutes * 60 * 1000;
        const recordTime = Math.max(minStartTime, maxRecordTime);
        const maxDuration = endTime - recordTime;
        let ffmpegOptions = ffmpeg();
        let userCount = 0;
        let amixString = '';
        const delayStrings: string[] = [];
        const createdFiles: string[] = [];

        for (const userId in streams) {
            const user = streams[userId];
            const duration = endTime - user.startTime;
            const delay = maxDuration - duration;
            const filePath = join(FileHelper.recordingsDir, `${endTime}-${userId}.wav`);
            try {
                await this.saveFile(user.stream, filePath);
                createdFiles.push(filePath);
                ffmpegOptions = ffmpegOptions.addInput(filePath)
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

    private async saveFile(stream: ReReadable, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = new FileWriter(filePath, {
                channels: this.channelCount,
                sampleRate: this.sampleRate
            });
            const readStream = stream.rewind();

            let bytesProcesses = -1;
            const interval = setInterval(() => {
                if (writeStream.bytesProcessed === bytesProcesses) {
                    readStream.unpipe(writeStream);
                    writeStream.end();
                    clearInterval(interval);
                }
                bytesProcesses = writeStream.bytesProcessed;
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