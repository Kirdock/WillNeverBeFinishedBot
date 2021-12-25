import { Message, VoiceChannel } from 'discord.js';
import { DiscordBot } from '../discordServer/DiscordBot';
import { ErrorTypes } from './ErrorTypes';
import { Logger } from './logger';
import { joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';

export class VoiceHelper {

    constructor(private discordBot: DiscordBot, private logger: Logger) {

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
            // message.member.voice.channel.join()
            connection = await this.joinVoiceChannelById(message.member.guild.id, message.member.voice.channel.id);
        } else {
            throw ErrorTypes.CHANNEL_JOIN_FAILED;
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
                throw ErrorTypes.CHANNEL_ID_NOT_FOUND;
            } else if (channel instanceof VoiceChannel) {
                try {
                    const conn = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guildId,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    });

                    conn.on('error', reason => {
                        this.logger.error(reason, {serverId, clientId});
                        conn.disconnect();
                    });
                    return conn;
                } catch (e) {
                    this.logger.error(e, {serverId, clientId});
                    throw ErrorTypes.CHANNEL_JOIN_FAILED;
                }
            } else {
                throw ErrorTypes.CHANNEL_NOT_VOICE;
            }
        } else {
            throw ErrorTypes.SERVER_ID_NOT_FOUND;
        }
    }

    public hasConnection(serverId: string): boolean {
        return this.discordBot.hasVoiceConnection(serverId);
    }

    /**
     *
     * @param serverId
     * @returns `VoiceConnection` or `undefined`
     */
    public getConnection(serverId: string): VoiceConnection | undefined {
        const connection = this.discordBot.getVoiceConnection(serverId);
        if (connection && connection?.state.status !== VoiceConnectionStatus.Ready) {
            connection.rejoin();
        }
        return connection;
    }

    /**
     *
     * @param serverId
     * @throws CONNECTION_NOT_FOUND
     */
    public disconnectVoice(serverId: string): void | never {
        const connection = this.getConnection(serverId);
        if (connection) {
            connection.disconnect();
        } else {
            throw ErrorTypes.CONNECTION_NOT_FOUND;
        }
    }
}