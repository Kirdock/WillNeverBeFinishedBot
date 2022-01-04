import axios from 'axios';
import { Client, Guild, GuildMember, Intents, Message, Permissions, Snowflake, User, VoiceChannel, VoiceState } from 'discord.js';
import { ServerSettings } from '../models/ServerSettings';
import { UserObject } from '../models/UserObject';
import { IUserServerInformation } from '../interfaces/IUserServerInformation';
import { PlayCommand } from '../modules/playSound';
import { QuestionCommand } from '../modules/question';
import { DatabaseHelper } from '../services/databaseHelper';
import { FileHelper } from '../services/fileHelper';
import { Logger } from '../services/logger';
import { VoiceHelper } from '../services/voiceHelper';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { getVoiceConnection, VoiceConnection } from '@discordjs/voice';

export class DiscordBot {
    private readonly client: Client;
    public readonly voiceHelper: VoiceHelper;
    private readonly superAdmins: string[];
    private readonly prefixes: string[];
    private readonly questionCommand: QuestionCommand;
    private readonly hostUrl: string;
    public readonly playSoundCommand: PlayCommand;

    public get id(): string {
        return this.client.user!.id;
    }

    constructor(private databaseHelper: DatabaseHelper, private fileHelper: FileHelper, private logger: Logger, config: IEnvironmentVariables) {
        this.prefixes = config.PREFIXES.split(',');
        this.hostUrl = config.HOST;
        this.superAdmins = config.OWNERS.split(',').map(owner => owner.trim()).filter(owner => owner);
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_INTEGRATIONS,
                Intents.FLAGS.GUILD_MESSAGES,
            ],
        });
        this.setReady();
        this.setVoiceStateUpdate();
        this.setOnMessage();
        this.client.login(config.CLIENT_TOKEN);
        this.voiceHelper = new VoiceHelper(this, databaseHelper, logger, this.fileHelper, config);
        this.playSoundCommand = new PlayCommand(logger, this.voiceHelper, databaseHelper, this.fileHelper);
        this.questionCommand = new QuestionCommand(logger, this.voiceHelper, this.databaseHelper, this.fileHelper);
    }

    private setReady() {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user!.tag}!`);
        });
    }

    public async fetchUserData(tokenData: { token_type: string, access_token: string }): Promise<UserObject> {
        const {data} = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenData.token_type} ${tokenData.access_token}`
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
    public getServer(serverId: string): Promise<Guild> {
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

    private setVoiceStateUpdate() {
        this.client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
            const serverInfo: ServerSettings = await this.databaseHelper.getServerSettings(newState.guild.id);

            if (!serverInfo) {
                return;
            }

            const newUserChannelId: Snowflake | undefined = newState.channel?.id;
            const oldUserChannelId: Snowflake | undefined = oldState.channel?.id;
            const oldChannelMemberCount = oldState.channel?.members?.size ?? 0;
            const newChannelMemberCount = newState.channel?.members?.size ?? 0;

            // VoiceState update
            if (newUserChannelId === oldUserChannelId) {
                // unmute
                if (serverInfo.playIntroWhenUnmuted && oldState.selfDeaf && !newState.selfDeaf) {
                    await this.playSoundCommand.playIntro(newState, serverInfo.defaultIntro);
                }
            } else {
                // user joins
                if (!oldUserChannelId) {
                    if (serverInfo.playIntro && (!serverInfo.minUser || newChannelMemberCount > 1)) {
                        await this.playSoundCommand.playIntro(newState, serverInfo.defaultIntro);
                    }
                }
                // user leaves
                else if (!newUserChannelId) {
                    if (serverInfo.playOutro && serverInfo.defaultOutro && oldChannelMemberCount > 0) {
                        const soundMeta = await this.databaseHelper.getSoundMeta(serverInfo.defaultOutro);
                        if (soundMeta) {
                            await this.playSoundCommand.playSound(oldState.guild.id, oldUserChannelId, soundMeta.path);
                        }
                        // else remove intro if not found?
                    }
                }
                // user switches channel
                else {
                    // 
                }

                // bot leaves if it is the only remaining member in the voice channel
                if (oldChannelMemberCount === 1 && oldState.channel?.members.get(this.id)) {
                    this.voiceHelper.disconnectVoice(oldState.guild.id);
                } else if (newChannelMemberCount === 1 && newState.channel?.members.get(this.id)) {
                    this.voiceHelper.disconnectVoice(newState.guild.id);
                }
            }
        });
    }

    private setOnMessage() {
        this.client.on('messageCreate', async (message: Message) => {
            // Will be changed because of slash-commmands

            let content = undefined;
            let prefixFound = false;
            const messageContent = message.content.toLocaleLowerCase().trim();
            for (let i = 0; i < this.prefixes.length; i++) {
                if (messageContent.startsWith(this.prefixes[i])) {
                    content = message.content.substring(this.prefixes[i].length);
                    prefixFound = true;
                    break;
                }
            }

            if (!prefixFound && messageContent.startsWith(`<@${this.id}>`)) {
                content = message.content.substring(this.id.length + 3);
            }
            if (content) {
                content = content.trim();
                if (this.playSoundCommand.isCommand(content)) {
                    await this.playSoundCommand.doWork(message);
                } else {
                    content = content.toLocaleLowerCase();
                    if (content.startsWith('list')) {
                        await message.reply(this.hostUrl);
                    } else if (this.questionCommand.isCommand(content)) {
                        await this.questionCommand.doWork(message);
                    } else if (content === 'ping') {
                        await message.reply('pong');
                    } else if (content === 'leave') {
                        if (message.guild) {
                            if (PlayCommand.forcePlayLock[message.guild.id]) {
                                if (await this.isUserAdminInServer(message.author.id, message.guild.id)) {
                                    this.voiceHelper.disconnectVoice(message.guild.id);
                                }
                            } else {
                                this.voiceHelper.disconnectVoice(message.guild.id);
                            }
                        }
                    } else if (content === 'stop') {
                        if (message.guild) {
                            await this.playSoundCommand.stopPlaying(message.guild.id, this.isSuperAdmin(message.author.id));
                        }
                    } else if (content === 'join') {
                        await this.voiceHelper.joinVoiceChannel(message);
                    } else if (content === 'flip') {
                        await message.reply(Math.floor(Math.random() * 2) == 0 ? 'Kopf' : 'Zahl');
                    } else if (content.startsWith('pick')) {
                        const elements = content.substring(4).split(',').map(item => item.trim()).filter(item => item.length !== 0);
                        if (elements.length !== 0) {
                            const index = Math.floor(Math.random() * elements.length - 1);
                            await message.reply(elements[index]);
                        }
                    } else if (content.startsWith('bubble')) {
                        const items = content.substring(6).split('x');
                        const numbers: number[] = [];
                        for (const item of items) {
                            const it: string = item.trim();
                            if (it) {
                                const n: number = +it;
                                if (!isNaN(n)) {
                                    numbers.push(n);
                                }
                            }
                        }

                        if (numbers.length >= 2) {
                            const text: string = `||pop||`;
                            const max: number = ((text.length * numbers[0] + 1) * numbers[1] + message.author.id.length + 3 + 1) > 2000 ? 15 : 250;
                            const a: number = Math.min(numbers[0], max);
                            const b: number = Math.min(numbers[1], max);
                            const stringBuilder: string[] = [];

                            for (let i = 0; i < b; ++i) {
                                stringBuilder.push('\n');
                                for (let y = 0; y < a; ++y) {
                                    stringBuilder.push(text);
                                }
                            }
                            message.reply(stringBuilder.join(''));
                        }
                    } else {
                        message.reply('Red Deitsch mit mir! I hob kan Plan wos du von mir wüllst!');
                    }
                }
            }
        });
    }

    public async getUserServers(userId: string, includeServerSettings: boolean): Promise<IUserServerInformation[]> {
        const allServers: IUserServerInformation[] = [];
        for (const guild of this.client.guilds.cache.values()) {
            const server: IUserServerInformation | undefined = await this.getUserServer(await guild.fetch(), userId);
            if (server) {
                if (includeServerSettings) {
                    server.settings = await this.databaseHelper.getServerSettings(server.id);
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
                isAdmin: member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
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

    public async isUserAdminInServer(userId: string, serverId: string): Promise<boolean> {
        let status: boolean;
        try {
            const guild = await this.client.guilds.fetch(serverId);
            const member = await this.getGuildMember(guild, userId);
            status = member?.permissions.has('ADMINISTRATOR') ?? false;
        } catch {
            status = false;
        }

        return status;
    }

    private async isUserAdminInServerThroughId(userId: string, serverId: string): Promise<boolean> {
        const guild = await this.client.guilds.fetch(serverId);
        let result = false;
        if (guild) {
            result = await this.isUserAdminInServer(userId, guild.id);
        }
        return result;
    }

    public isSuperAdmin(userId: string): boolean {
        return this.superAdmins.includes(userId);
    }

    public async getVoiceChannelsOfServer(serverId: string): Promise<{ id: Snowflake, name: string }[]> {
        const guild = await this.getServer(serverId);
        return guild?.channels.cache.filter((channel): channel is VoiceChannel => channel.type === 'GUILD_VOICE')
            .sort((channel1, channel2) => channel1.rawPosition - channel2.rawPosition)
            .map(item => {
                return {
                    id: item.id,
                    name: item.name
                }
            }) ?? [];
    }

    public async getUsers(serverId: string): Promise<GuildMember[]> {
        const guild: Guild = await this.getServer(serverId);
        let users: GuildMember[] = [];
        if (guild) {
            users = Array.from((await guild.members.fetch()).values());
        }
        return users;
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
            const guild: Guild = await this.getServer(serverId);
            if (guild) {
                const member = await this.getGuildMember(guild, userId);
                if (member?.voice?.channelId) {
                    result = member.voice.channelId;
                }
            }
        } else {
            result = channelId;
        }
        return result;
    }

    public async mapUsernames(array: any[], key: string) {
        for (const userObject of array) {
            userObject.username = (await this.getSingleUser(userObject[key]))?.username;
        }
        array.sort((a, b) => a.username.localeCompare(b.username));
    }
}