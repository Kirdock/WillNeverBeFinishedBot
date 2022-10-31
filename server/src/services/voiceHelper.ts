import { Message, VoiceChannel } from 'discord.js';
import { DiscordBot } from '../discordServer/DiscordBot';
import { ErrorTypes } from './ErrorTypes';
import { joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { DatabaseHelper } from './databaseHelper';
import { RecordVoiceHelper } from './record-voice-helper';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { logger } from './logHelper';

export class VoiceHelper {
    public readonly recordHelper: RecordVoiceHelper;

    constructor(private discordBot: DiscordBot, private databaseHelper: DatabaseHelper, config: IEnvironmentVariables) {
        this.recordHelper = new RecordVoiceHelper(config, discordBot);
    }

    /**
     *
     * @param message
     * @returns
     * @throws CHANNEL_JOIN_FAILED
     */
    public async joinVoiceChannel(message: Message): Promise<VoiceConnection> {
        let connection: VoiceConnection;
        if (message.member?.voice.channel) {
            connection = await this.joinVoiceChannelById(message.member.guild.id, message.member.voice.channel.id);
        } else {
            throw new Error(ErrorTypes.CHANNEL_JOIN_FAILED);
        }
        return connection;
    }

    /**
     *
     * @param serverId
     * @param clientId
     * @returns Connection of joined voice channel
     * @throws Error
     */
    async joinVoiceChannelById(serverId: string, clientId: string): Promise<VoiceConnection> {
        const server = await this.discordBot.getServer(serverId);
        if (server) {
            const channel = await server.channels.fetch(clientId);
            if (!channel) {
                throw new Error(ErrorTypes.CHANNEL_ID_NOT_FOUND);
            } else if (channel instanceof VoiceChannel) {
                try {
                    const conn = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guildId,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                        selfDeaf: false,
                    });

                    const serverSettings = await this.databaseHelper.getServerSettings(serverId);
                    if (serverSettings.recordVoice) {
                        this.recordHelper.startRecording(conn);
                    }

                    conn.on('error', reason => {
                        logger.error(reason, {serverId, clientId});
                        conn.disconnect();
                    });
                    return conn;
                } catch (e) {
                    logger.error(e as Error, {serverId, clientId});
                    throw new Error(ErrorTypes.CHANNEL_JOIN_FAILED);
                }
            } else {
                throw new Error(ErrorTypes.CHANNEL_NOT_VOICE);
            }
        } else {
            throw new Error(ErrorTypes.SERVER_ID_NOT_FOUND);
        }
    }

    public async getOrJoinVoiceChannel(serverId: string, channelId: string): Promise<VoiceConnection> {
        let connection = this.discordBot.getVoiceConnection(serverId);
        if (connection) {
            if (connection.joinConfig.channelId !== channelId || connection.state.status !== VoiceConnectionStatus.Ready) {
                connection.rejoin({
                    channelId,
                    selfDeaf: false,
                    selfMute: false,
                });
            }
        } else {
            connection = await this.joinVoiceChannelById(serverId, channelId)
        }
        return connection;
    }

    /**
     *
     * @param serverId
     * @returns `VoiceConnection` or `undefined`
     */
    public getActiveConnection(serverId: string): VoiceConnection | undefined {
        return this.discordBot.getVoiceConnection(serverId);
    }

    /**
     *
     * @param serverId
     * @throws CONNECTION_NOT_FOUND
     */
    public disconnectVoice(serverId: string): void | never {
        const connection = this.getActiveConnection(serverId);
        if (connection) {
            connection.disconnect();
        } else {
            throw new Error(ErrorTypes.CONNECTION_NOT_FOUND);
        }
    }
}