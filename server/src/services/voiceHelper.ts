import { Message, VoiceChannel, VoiceConnection } from "discord.js";
import { DiscordBot } from "../discordServer/DiscordBot";
import { ErrorTypes } from "./ErrorTypes";
import Logger from "./logger";

export default class VoiceHelper {

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
            connection = await message.member.voice.channel.join();
        }
        else {
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
        let connection: VoiceConnection;
        if (server) {
            const channel = server.channels.cache.get(clientId);
            if (!channel) {
                throw ErrorTypes.CHANNEL_ID_NOT_FOUND;
            }
            else if (channel instanceof VoiceChannel) {
                try {
                    const conn = await channel.join();
                    conn.on('error', reason => {
                        this.logger.error(reason, { serverId, clientId });
                        conn.removeAllListeners();
                        this.disconnectVoice(conn.channel.id);
                    });
                    conn.on('failed', reason => {
                        this.logger.error(reason, { serverId, clientId });
                        conn.removeAllListeners();
                    });
                    connection = conn;
                }
                catch (e) {
                    this.logger.error(e, { serverId, clientId });
                    throw ErrorTypes.CHANNEL_JOIN_FAILED;
                }
            }
            else {
                throw ErrorTypes.CHANNEL_NOT_VOICE;
            }
        }
        else {
            throw ErrorTypes.SERVER_ID_NOT_FOUND;
        }
        //ErrorType throw Error
        //Error also has data where it was thrown
        return connection;
    }

    public hasConnection(serverId: string): boolean {
        return this.discordBot.hasVoiceConnection(serverId);
    }

    /**
     * 
     * @param serverId 
     * @returns `VoiceConnection` or `undefined`
     */
    public getConnection(serverId: string): VoiceConnection| undefined {
        return this.discordBot.getVoiceConnection(serverId);
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
        }
        else {
            throw ErrorTypes.CONNECTION_NOT_FOUND;
        }
    }
}