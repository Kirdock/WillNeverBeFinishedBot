import type { Guild, GuildMember, LocaleString, Snowflake } from 'discord.js';
import { VoiceChannel } from 'discord.js';
import { ErrorTypes } from './ErrorTypes';
import type { VoiceConnection } from '@discordjs/voice';
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { databaseHelper } from './databaseHelper';
import { scopedLogger } from './logHelper';
import { discordBot } from '../discordServer/DiscordBot';
import { InteractionError } from '../utils/InteractionError';
import { recordHelper } from './recordHelper';
import { getCommandLangKey } from '../discordServer/applicationCommands/commandLang';
import { CommandLangKey } from '../discordServer/applicationCommands/types/lang.types';

const logger = scopedLogger('VOICE');

class VoiceHelper {
    /**
     *
     * @param serverId
     * @param clientId
     * @returns Connection of joined voice channel
     * @throws Error
     */
    async joinVoiceChannelById(serverId: Snowflake, clientId: Snowflake): Promise<VoiceConnection> {
        const server = await discordBot.getServer(serverId);
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

                const serverSettings = await databaseHelper.getServerSettings(serverId);
                if (serverSettings.recordVoice) {
                    recordHelper.startRecording(conn);
                }

                conn.on('error', (reason) => {
                    logger.error(reason, { serverId, clientId });
                    conn.disconnect();
                });
                return conn;
            } catch (e) {
                logger.error(e, { serverId, clientId });
                throw new Error(ErrorTypes.CHANNEL_JOIN_FAILED);
            }
        } else {
            throw new Error(ErrorTypes.CHANNEL_NOT_VOICE);
        }
    }

    public async getOrJoinVoiceChannel(serverId: string, channelId: string): Promise<VoiceConnection> {
        let connection = discordBot.getVoiceConnection(serverId);
        if (connection) {
            if (connection.joinConfig.channelId !== channelId || connection.state.status !== VoiceConnectionStatus.Ready) {
                connection.rejoin({
                    channelId,
                    selfDeaf: false,
                    selfMute: false,
                });
            }
        } else {
            connection = await this.joinVoiceChannelById(serverId, channelId);
        }
        return connection;
    }

    /**
     *
     * @param serverId
     * @returns `VoiceConnection` or `undefined`
     */
    public getActiveConnection(serverId: string): VoiceConnection | undefined {
        return discordBot.getVoiceConnection(serverId);
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

    public async joinVoiceChannelThroughMember(member: GuildMember, guild: Guild, locale?: LocaleString) {
        if (!member.voice.channelId) {
            const message = locale ? getCommandLangKey(locale, CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL) : `Member ${member.user.username} is not in a voice channel!`;
            throw new InteractionError(message);
        }
        await this.joinVoiceChannelById(guild.id, member.voice.channelId);
    }
}

export const voiceHelper = new VoiceHelper();