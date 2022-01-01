import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';
import { Logger } from './logger';
import ffmpeg from 'fluent-ffmpeg';
import { ReadStream } from 'fs';
import { join } from 'path';
import { FileHelper } from './fileHelper';
import { FileWriter } from 'wav';
import { ReplayReadable } from '../models/replay-readable';
import { IEnvironmentVariables } from '../interfaces/environment-variables';

interface UserStreams {
    [userId: string]: {
        source: ReadStream,
        out: ReplayReadable,
    };
}

export class RecordVoiceHelper {
    private readonly maxRecordTimeMs; // 10 minutes
    private readonly channelCount = 1;
    private readonly sampleRate = 16_000;
    private readonly maxUserRecordingLength = 100 * 1024 * 1024; // 100 MB
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
                //check if already listening to user
                if (!this.writeStreams[serverId].userStreams[userId]) {
                    const out = new ReplayReadable(this.maxRecordTimeMs, this.sampleRate, this.channelCount, {highWaterMark: this.maxUserRecordingLength, length: this.maxUserRecordingLength});
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

                    opusStream.pipe(out);

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
        if (!this.writeStreams[serverId]) {
            return;
        }
        const recordTimeMs = Math.min(Math.abs(minutes) * 60 * 1_000, this.maxRecordTimeMs)
        const endTime = Date.now();
        return new Promise(async (resolve, reject) => {
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

            if (!minStartTime || (stream.out.startTime < minStartTime)) {
                minStartTime = stream.out.startTime;
            }
        }
        return minStartTime;
    }

    private async getFfmpegSpecs(streams: UserStreams, minStartTime: number, endTime: number, recordTimeMs: number) {
        const maxRecordTime = endTime - recordTimeMs;
        const startRecordTime = Math.max(minStartTime, maxRecordTime);
        // length of the result recording would be endTime - startRecordTime
        let ffmpegOptions = ffmpeg();
        let amixString = '';
        const delayStrings: string[] = [];
        const createdFiles: string[] = [];

        for (const userId in streams) {
            const stream = streams[userId];
            const filePath = join(FileHelper.recordingsDir, `${endTime}-${userId}.wav`);
            try {
                await this.saveFile(stream.out, filePath, endTime);
                const skipTime = startRecordTime - stream.out.startTime; // or durationOfFile - maxDuration. Silent padding is added at the end, so durationOfFile would be valid
                let delay = stream.out.startTime - startRecordTime;
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

    private async saveFile(stream: ReplayReadable, filePath: string, endTime: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = new FileWriter(filePath, {
                channels: this.channelCount,
                sampleRate: this.sampleRate
            });

            const readStream = stream.rewind(endTime);

            readStream.pipe(writeStream);

            writeStream.on('done', () => {
                readStream.destroy();
                resolve();
            });
            writeStream.on('error', (error: Error) => {
                this.logger.error(error, 'Error while saving user recording');
                reject(error);
            });
        });
    }
}