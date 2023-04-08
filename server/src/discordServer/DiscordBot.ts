import axios from 'axios';
import type { Guild, GuildMember, Snowflake, User, VoiceChannel } from 'discord.js';
import { ChannelType, Client, Events, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import type { IUserObject } from '../interfaces/UserObject';
import type { IUserServerInformation } from '../interfaces/IUserServerInformation';
import { databaseHelper } from '../services/databaseHelper';
import type { VoiceConnection } from '@discordjs/voice';
import { getVoiceConnection } from '@discordjs/voice';
import { scopedLogger } from '../services/logHelper';
import { EnvironmentConfig } from '../services/config';
import { setupApplicationCommands } from './applicationCommands/applicationManager';
import onMessageCreate from './events/onMessageCreate';
import onVoiceStateUpdate from './events/onVoiceStateUpdate';

const logger = scopedLogger('BOT');

export class DiscordBot {
    public readonly client: Client<true>;
    private superAdmins: string[] = [];
    public readonly hostUrl: string;

    public get id(): string {
        return this.client.user.id;
    }

    constructor() {
        this.hostUrl = EnvironmentConfig.HOST;
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
        });
    }

    public async run(): Promise<void> {
        this.client.on(Events.ClientReady, async () => {
            logger.info(`Logged in as ${this.client.user.tag}!`);
            await onVoiceStateUpdate(this.client);
            onMessageCreate(this);
            await setupApplicationCommands(this.client);

            const admins = [...EnvironmentConfig.OWNERS.split(','), this.client.application.owner?.id].map((owner) => owner?.trim());
            this.superAdmins = admins.filter((owner: string | undefined, index: number): owner is string => !!owner && admins.indexOf(owner) === index);
        });
        this.client.on(Events.Error, (error)=> {
            logger.error(error, { context: 'ClientError' });
        });

        await this.client.login(EnvironmentConfig.CLIENT_TOKEN);
    }

    public async fetchUserData(tokenData: { token_type: string, access_token: string }): Promise<IUserObject> {
        const { data } = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenData.token_type} ${tokenData.access_token}`,
            },
        });
        return data;
    }

    /**
     *
     * @param serverId
     * @returns
     * @throws Error if guild is not found or invalid id is provided
     */
    public getServer(serverId: Snowflake): Promise<Guild> {
        return this.client.guilds.fetch(serverId);
    }

    /**
     *
     * @param serverId
     * @returns `VoiceConnection` or `undefined`
     */
    public getVoiceConnection(serverId: string): VoiceConnection | undefined {
        return getVoiceConnection(serverId);
    }

    public async getUserServers(userId: string, includeServerSettings: boolean): Promise<IUserServerInformation[]> {
        const allServers: IUserServerInformation[] = [];
        for (const guild of this.client.guilds.cache.values()) {
            const server: IUserServerInformation | undefined = await this.getUserServer(await guild.fetch(), userId);
            if (server) {
                if (includeServerSettings) {
                    server.settings = await databaseHelper.getServerSettings(server.id);
                }
                allServers.push(server);
            }
        }
        return allServers;
    }

    private async getGuildMember(guild: Guild, userId: string): Promise<GuildMember | null> {
        let member: GuildMember | null;
        try {
            member = await guild.members.fetch(userId);
        } catch {
            member = null;
        }
        return member;
    }

    private async getUserServer(guild: Guild, userId: string): Promise<IUserServerInformation | undefined> {
        const member = await this.getGuildMember(guild, userId);
        let server: IUserServerInformation | undefined;
        const isOwner = this.isSuperAdmin(userId);
        if (member) {
            server = {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                isAdmin: member.permissions.has(PermissionFlagsBits.Administrator),
            };
        } else if (isOwner) {
            server = {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                isAdmin: true,
            };
        }
        return server;
    }

    public async hasUserAdminServers(userId: string): Promise<boolean> {
        for (const guild of this.client.guilds.cache) {
            if (await this.isUserAdminInServer(userId, guild[0])) {
                return true;
            }
        }
        return false;
    }

    public async getUsersWhereIsAdmin(userId: string, serverId: string): Promise<GuildMember[]> {
        let users: GuildMember[] = [];
        if (await this.isUserAdminInServer(userId, serverId)) {
            users = await this.getUsers(serverId);
        }
        users.sort((a, b) => a.displayName.localeCompare(b.displayName));
        return users;
    }

    /**
     *
     * @param userId
     * @param serverId
     * @throws never
     */
    public async isUserAdminInServer(userId: string, serverId: string): Promise<boolean> {
        let status: boolean;
        try {
            const guild = await this.client.guilds.fetch(serverId);
            const member = await this.getGuildMember(guild, userId);
            status = member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
        } catch {
            status = false;
        }

        return status;
    }

    public async isUserAdminInServerOrSuperAdmin(userId: string, serverId: string): Promise<boolean> {
        return (await this.isUserAdminInServer(userId, serverId)) || this.isSuperAdmin(userId);
    }

    private async isUserAdminInServerThroughId(userId: string, serverId: string): Promise<boolean> {
        const guild = await this.client.guilds.fetch(serverId);
        return await this.isUserAdminInServer(userId, guild.id);
    }

    public isSuperAdmin(userId: string): boolean {
        return this.superAdmins.includes(userId);
    }

    public async getVoiceChannelsOfServer(serverId: string): Promise<{ id: Snowflake, name: string }[]> {
        const guild = await this.getServer(serverId);
        return guild.channels.cache.filter((channel): channel is VoiceChannel => channel.type === ChannelType.GuildVoice)
            .sort((channel1, channel2) => channel1.rawPosition - channel2.rawPosition)
            .map((item) => {
                return {
                    id: item.id,
                    name: item.name,
                };
            });
    }

    public async getUsers(serverId: string): Promise<GuildMember[]> {
        const guild: Guild = await this.getServer(serverId);
        return Array.from((await guild.members.fetch()).values());
    }

    public async getSingleUser(userId: string): Promise<User> {
        return this.client.users.fetch(userId);
    }


    public async isUserAdminWhereAnotherUser(userIdAdmin: string, userId: string, serverId: string): Promise<boolean> {
        let result = this.isSuperAdmin(userId);
        if (!result) {
            const status = await this.isUserAdminInServerThroughId(userIdAdmin, serverId);
            if (status) {
                result = await this.isUserInServer(userId, serverId);
            }
        }
        return result;
    }

    public async isUserInServer(userId: string, serverId: string): Promise<boolean> {
        let result = this.isSuperAdmin(userId);
        if (!result) {
            const guild = this.client.guilds.cache.get(serverId);
            if (guild) {
                const member = await this.getGuildMember(guild, userId);
                result = !!member;
            }
        }
        return result;
    }

    /**
     *
     * @param joinToUser
     * @param serverId
     * @param channelId
     * @param userId
     * @returns the channelId the bot will join
     */
    public async getChannelIdThroughUser(joinToUser: boolean, serverId: string, channelId: string, userId: Snowflake): Promise<string | null> {
        let result: string | null = null;
        if (joinToUser) {
            const guild = await this.getServer(serverId);
            const member = await this.getGuildMember(guild, userId);
            if (member?.voice.channelId) {
                result = member.voice.channelId;
            }
        } else {
            result = channelId;
        }
        return result;
    }

    public async mapUsernames<T extends Record<U, string> & { username?: string }, U extends keyof T>(array: T[], key: U) {
        for (const userObject of array) {
            userObject.username = (await this.getSingleUser(userObject[key])).username;
        }
    }

    /**
     * The given user array is extended by the missing users (users not in the database but in the server).
     * @param users
     * @param serverId
     * @param defaultValuesFunc
     */
    public async addMissingUsers<T extends Record<U, unknown> & { id: string }, U extends keyof T>(users: T[], serverId: string, defaultValuesFunc: (userId: string) => T): Promise<void> {
        const discordUsers = await this.getUsers(serverId);
        const userDict: Record<string, number | undefined> = users.reduce((dict, user, index) => {
            dict[user.id] = index;
            return dict;
        }, {} as Record<string, number | undefined>);


        for (const discordUser of discordUsers) {
            if (userDict[discordUser.id] !== undefined) {
                continue;
            }

            userDict[discordUser.id] = users.length;
            users.push(defaultValuesFunc(discordUser.id));
        }
    }
}

export const discordBot = new DiscordBot();
