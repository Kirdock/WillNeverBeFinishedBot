import { AudioReceiveStream, EndBehaviorType, SpeakingMap, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';
import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { FileHelper } from './fileHelper';
import { FileWriter } from 'wav';
import { ReplayReadable } from '../models/replay-readable';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { AudioExportType } from '../../../shared/models/types';
import { logger } from './logHelper';

interface UserStreams {
    [userId: string]: {
        source: AudioReceiveStream,
        out: ReplayReadable,
    };
}

export class RecordVoiceHelper {
    private readonly maxRecordTimeMs: number; // 10 minutes
    private readonly channelCount = 2;
    private readonly sampleRate = 16_000;
    private readonly maxUserRecordingLength = 100 * 1024 * 1024; // 100 MB
    private writeStreams: {
        [serverId: string]: {
            userStreams: UserStreams,
            listener: (userId: string) => void;
        }
    } = {};

    constructor(config: IEnvironmentVariables) {
        const recordTime = +config.MAX_RECORD_TIME_MINUTES;
        this.maxRecordTimeMs = (!recordTime || isNaN(recordTime) ? 10 : Math.abs(recordTime)) * 60 * 1_000;
    }

    public startRecording(connection: VoiceConnection): void {
        const serverId = connection.joinConfig.guildId;
        if (this.writeStreams[serverId]) {
            return;
        }
        const listener = (userId: string) => {
            const recordStream = this.getRecordStreamOfUser(serverId, userId);
            const opusStream = connection.receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: SpeakingMap.DELAY,
                },
            });

            recordStream.startTimeOfNextChunk = connection.receiver.speaking.users.get(userId);
            opusStream.on('error', (error: Error) => {
                logger.error(error, `Error while recording voice for user ${userId} in server: ${serverId}`);
            });

            opusStream.pipe(recordStream);

            this.writeStreams[serverId].userStreams[userId] = {
                source: opusStream,
                out: recordStream
            };
        }
        this.writeStreams[serverId] = {
            userStreams: {},
            listener,
        };
        connection.receiver.speaking.on('start', listener);
    }

    private getRecordStreamOfUser(serverId: string, userId: string): ReplayReadable {
        let recordStream = this.writeStreams[serverId].userStreams[userId]?.out;

        return recordStream || new ReplayReadable(this.maxRecordTimeMs, this.sampleRate, this.channelCount, {
            highWaterMark: this.maxUserRecordingLength,
            length: this.maxUserRecordingLength
        });
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

    public async getRecordedVoice(serverId: Snowflake, exportType: AudioExportType = 'audio', minutes: number = 10): Promise<string | undefined> {
        if (!this.writeStreams[serverId]) {
            logger.warn(`server with id ${serverId} does not have any streams`, 'Record voice');
            return;
        }
        const recordDurationMs = Math.min(Math.abs(minutes) * 60 * 1_000, this.maxRecordTimeMs)
        const endTime = Date.now();
        return new Promise(async (resolve, reject) => {
            const minStartTime = this.getMinStartTime(serverId);

            if (!minStartTime) {
                return resolve(undefined);
            }

            const {command, createdFiles} = await this.getFfmpegSpecs(this.writeStreams[serverId].userStreams, minStartTime, endTime, recordDurationMs);
            if (!createdFiles.length) {
                return resolve(undefined);
            }
            const resultPath = join(FileHelper.recordingsDir, `${endTime}.wav`);
            command
                .on('end', async () => {
                    let path;
                    if (exportType === 'audio') {
                        path = resultPath;
                        await FileHelper.deleteFilesByPath(createdFiles);
                    } else {
                        const files = [resultPath, ...createdFiles];
                        path = await this.toMKV(files, endTime);
                        await FileHelper.deleteFilesByPath(files);
                    }
                    resolve(path);
                })
                .on('error', reject)
                .saveToFile(resultPath);
        });
    }

    private toMKV(files: string[], endTime: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let options = ffmpeg();
            const outputOptions: string[] = [];
            const filePath = join(FileHelper.recordingsDir, `${endTime}.mkv`);
            for (let i = 0; i < files.length; ++i) {
                options = options.addInput(files[i]);
                outputOptions.push(`-map ${i}`);
            }
            options
                .outputOptions(outputOptions)
                .on('end', () => {
                    resolve(filePath);
                })
                .on('error', reject)
                .saveToFile(filePath);
        })
    }

    private getMinStartTime(serverId: string): number | undefined {
        let minStartTime: number | undefined;
        for (const userId in this.writeStreams[serverId].userStreams) {
            const startTime = this.writeStreams[serverId].userStreams[userId].out.startTime;

            if (!minStartTime || (startTime < minStartTime)) {
                minStartTime = startTime;
            }
        }
        return minStartTime;
    }

    private async getFfmpegSpecs(streams: UserStreams, minStartTime: number, endTime: number, recordDurationMs: number) {
        const maxRecordTime = endTime - recordDurationMs;
        const startRecordTime = Math.max(minStartTime, maxRecordTime);

        /*
        ------|----------------------|----------------|-------------------------------|-------
        ------|----------------------|----------------|-------------------------------|-------
             user1 Start      startRecordTime    user2 Start                        endTime
              |<-----skipTime------->|<---delayTime-->|

         delayTime = userStartTime - startRecordTime  // valid if > 0
         skipTime = startRecordTime - userStartTime   // valid if > 0
         */

        // length of the result recording would be endTime - startRecordTime
        let ffmpegOptions = ffmpeg();
        let amixStrings = [];
        const createdFiles: string[] = [];

        for (const userId in streams) {
            const stream = streams[userId].out;
            const filePath = join(FileHelper.recordingsDir, `${endTime}-${userId}.wav`);
            try {
                await this.saveFile(stream, filePath, startRecordTime, endTime);
                ffmpegOptions = ffmpegOptions.addInput(filePath);

                amixStrings.push(`[${createdFiles.length}:a]`);
                createdFiles.push(filePath);
            } catch (e) {
                logger.error(e as Error, 'Error while saving user recording');
            }
        }

        return {
            command: ffmpegOptions.complexFilter([
                {
                    filter: `amix=inputs=${createdFiles.length}[a]`,
                    inputs: amixStrings.join(''),
                }
            ]).map('[a]'),
            createdFiles
        }
    }

    private async saveFile(stream: ReplayReadable, filePath: string, startTime: number, endTime: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = new FileWriter(filePath, {
                channels: this.channelCount,
                sampleRate: this.sampleRate
            });

            const readStream = stream.rewind(startTime, endTime);

            readStream.pipe(writeStream);

            writeStream.on('done', () => {
                resolve();
            });
            writeStream.on('error', (error: Error) => {
                logger.error(error, 'Error while saving user recording');
                reject(error);
            });
        });
    }
}