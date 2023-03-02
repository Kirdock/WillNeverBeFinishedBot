import { AudioReceiveStream, EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { resolve } from 'path';
import { ReplayReadable } from '../models/replay-readable';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { AudioExportType } from '../../../shared/models/types';
import { logger } from './logHelper';
import { IServerSettings, IServerUserSettings } from '../../../shared/interfaces/server-settings';
import { getOrCreateUserVoiceSetting } from '../utils/User';
import net, { Server } from 'net';
import { randomUUID } from 'crypto';
import { PassThrough, Readable, Writable } from 'stream';
import archiver from 'archiver';
import { DiscordBot } from '../discordServer/DiscordBot';

interface IUserStreams {
    [userId: string]: {
        source: AudioReceiveStream,
        out: ReplayReadable,
    };
}

interface ISocketServerConfig {
    url: string;
    server: Server;
}

export class RecordVoiceHelper {
    private readonly maxRecordTimeMs: number; // 10 minutes
    private readonly channelCount = 2;
    private readonly sampleRate = 16_000;
    private readonly maxUserRecordingLength = 100 * 1024 * 1024; // 100 MB
    private static readonly PCM_FORMAT = 's16le';
    private writeStreams: {
        [serverId: string]: {
            userStreams: IUserStreams,
            listener: (userId: string) => void;
        }
    } = {};

    constructor(config: IEnvironmentVariables, private discordBot: DiscordBot) {
        const recordTime = +config.MAX_RECORD_TIME_MINUTES;
        this.maxRecordTimeMs = (!recordTime || isNaN(recordTime) ? 10 : Math.abs(recordTime)) * 60 * 1_000;
    }

    public startRecording(connection: VoiceConnection): void {
        const serverId = connection.joinConfig.guildId;
        if (this.writeStreams[serverId]) {
            return;
        }
        const listener = (userId: string) => {
            this.writeStreams[serverId].userStreams[userId] = this.getRecordStreamOfUser(serverId, userId, connection);
        }
        this.writeStreams[serverId] = {
            userStreams: {},
            listener,
        };
        connection.receiver.speaking.on('start', listener);
    }

    private getRecordStreamOfUser(serverId: string, userId: string, connection: VoiceConnection): {out: ReplayReadable, source: AudioReceiveStream} {
        const streams:  {source: AudioReceiveStream, out: ReplayReadable} | undefined = this.writeStreams[serverId].userStreams[userId];
        if(streams) {
            return streams;
        }
        const recordStream = new ReplayReadable(this.maxRecordTimeMs, this.sampleRate, this.channelCount, connection, userId, {
            highWaterMark: this.maxUserRecordingLength,
            length: this.maxUserRecordingLength
        });
        const opusStream = connection.receiver.subscribe(userId, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: this.maxRecordTimeMs,
            },
        });

        opusStream.on('error', (error: Error) => {
            logger.error(error, `Error while recording voice for user ${userId} in server: ${serverId}`);
        });

        opusStream.on('end', () => {
            this.stopUserRecording(serverId, userId);
        });

        opusStream.pipe(recordStream, {end: false});

        return { out: recordStream, source: opusStream };
    }

    public stopRecording(connection: VoiceConnection): void {
        const serverId = connection.joinConfig.guildId;
        const serverStreams = this.writeStreams[serverId];
        connection.receiver.speaking.removeListener('start', serverStreams.listener);

        for (const userId in serverStreams.userStreams) {
            this.stopUserRecording(serverId, userId);
        }
        delete this.writeStreams[serverId];
    }

    private stopUserRecording(serverId: string, userId: string): void {
        const serverStreams = this.writeStreams[serverId];
        const userStream = serverStreams.userStreams[userId];
        userStream.source.destroy();
        userStream.out.destroy();
        delete serverStreams.userStreams[userId];
    }

    public async getRecordedVoice<T extends Writable>(serverId: Snowflake, exportType: AudioExportType = 'single', minutes: number = 10, serverSettings: IServerSettings, writeStream: T): Promise<boolean> {
        if (!this.writeStreams[serverId]) {
            logger.warn(`server with id ${serverId} does not have any streams`, 'Record voice');
            return false;
        }
        const minStartTimeMs = this.getMinStartTime(serverId);

        if (!minStartTimeMs) {
            return false;
        }

        const recordDurationMs = Math.min(Math.abs(minutes) * 60 * 1_000, this.maxRecordTimeMs)
        const endTimeMs = Date.now();
        const maxRecordTime = endTimeMs - recordDurationMs;
        const startRecordTime = Math.max(minStartTimeMs, maxRecordTime);
        const recordMethod = (exportType === 'single' ? this.generateMergedRecording : this.generateSplitRecording).bind(this);

        return recordMethod(this.writeStreams[serverId].userStreams, startRecordTime, endTimeMs, serverSettings, writeStream);
    }

    private generateMergedRecording(userStreams: IUserStreams, startRecordTime: number, endTime: number, serverSettings: IServerSettings, writeStream: Writable): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const {command, openServers} = this.getFfmpegSpecs(userStreams, startRecordTime, endTime, serverSettings);
            if (!openServers.length) {
                return resolve(false);
            }
            command
                .on('end', () => {
                    openServers.forEach(server => server.close());
                    resolve(true);
                })
                .on('error', (error) => {
                    openServers.forEach(server => server.close());
                    reject(error);
                })
                .outputFormat('mp3')
                .pipe(writeStream, {end: true});
        });
    }

    private async generateSplitRecording(userStreams: IUserStreams, startRecordTime: number, endTime: number, serverSettings: IServerSettings, writeStream: Writable): Promise<boolean> {
        const archive = archiver('zip');
        const userIds = Object.keys(userStreams);
        if (!userIds.length) {
            return false;
        }
        for (const userId of userIds) {
            const passThroughStream = this.getUserRecordingStream(userStreams[userId].out.rewind(startRecordTime, endTime), userId, serverSettings.userSettings);
            const {username} = await this.discordBot.getSingleUser(userId)
            archive.append(passThroughStream, {
                name: `${username}.mp3`
            });
        }

        return new Promise((resolve, reject) => {
            archive
                .on('end', () => resolve(true))
                .on('error', reject)
                .pipe(writeStream);
            archive.finalize();
        });
    }

    private getUserRecordingStream(stream: Readable, userId: string, userSettings: IServerUserSettings[]): PassThrough {
        const userSetting = getOrCreateUserVoiceSetting(userSettings, userId);
        const passThroughStream = new PassThrough({allowHalfOpen: false});

        ffmpeg(stream)
            .inputOptions(this.getRecordInputOptions())
            .audioFilters([
                    {
                        filter: 'volume',
                        options: (userSetting.recordVolume / 100).toString()
                    }
                ]
            )
            .outputFormat('mp3')
            .output(passThroughStream, {end: true})
            .run();
        return passThroughStream;
    }

    private getMinStartTime(serverId: string): number | undefined {
        let minStartTime: number | undefined;
        for (const userId in this.writeStreams[serverId].userStreams) {
            const startTime = this.writeStreams[serverId].userStreams[userId].out.startTimeMs;

            if (!minStartTime || (startTime < minStartTime)) {
                minStartTime = startTime;
            }
        }
        return minStartTime;
    }

    private getFfmpegSpecs(streams: IUserStreams, startRecordTime: number, endTimeMs: number, serverSettings: IServerSettings): { command: FfmpegCommand, openServers: Server[] } {
        let ffmpegOptions = ffmpeg();
        let amixStrings = [];
        const volumeFilter = [];
        const openServers: Server[] = [];

        for (const userId in streams) {
            const stream = streams[userId].out;
            const userSettings = getOrCreateUserVoiceSetting(serverSettings.userSettings, userId);
            try {
                const output: string = `[s${volumeFilter.length}]`;
                const {server, url} = this.serveStream(stream, startRecordTime, endTimeMs);

                ffmpegOptions = ffmpegOptions
                    .addInput(url)
                    .inputOptions(this.getRecordInputOptions());

                volumeFilter.push({
                    filter: 'volume',
                    options: [(userSettings.recordVolume / 100).toString()],
                    inputs: `${volumeFilter.length}:0`,
                    outputs: output,
                });
                openServers.push(server)
                amixStrings.push(output);
            } catch (e) {
                logger.error(e as Error, 'Error while saving user recording');
            }
        }

        return {
            command: ffmpegOptions.complexFilter([
                ...volumeFilter,
                {
                    filter: `amix=inputs=${volumeFilter.length}`,
                    inputs: amixStrings.join(''),
                }
            ]),
            openServers,
        }
    }

    private getRecordInputOptions(): string[] {
        return [`-f ${RecordVoiceHelper.PCM_FORMAT}`, `-ar ${this.sampleRate}`, `-ac ${this.channelCount}`];
    }

    private serveStream(stream: ReplayReadable, startRecordTime: number, endTimeMs: number): ISocketServerConfig {
        const socketPath = resolve('/tmp/', randomUUID() + '.sock');
        const url = 'unix:' + socketPath;
        const server = net.createServer((socket) => stream.rewind(startRecordTime, endTimeMs).pipe(socket));
        server.listen(socketPath);
        // complex filters are probably reading the files several times. Therefore, the server can't be closed after the stream is read.
        return {
            url,
            server
        };
    }
}
