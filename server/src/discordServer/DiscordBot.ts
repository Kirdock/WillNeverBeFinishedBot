import axios from 'axios';
import { GuildMemberManager, Intents, User } from 'discord.js';
import { Client, Collection, Guild, GuildMember, Message, Snowflake, VoiceConnection, VoiceState } from 'discord.js';
import { ServerSettings } from '../models/ServerSettings';
import { UserObject } from '../models/UserObject';
import { UserServerInformation } from '../models/UserServerInformation';
import { PlayCommand } from '../modules/playSound';
import { QuestionCommand } from '../modules/question';
import { DatabaseHelper } from '../services/databaseHelper';
import FileHelper from '../services/fileHelper';
import Logger from '../services/logger';
import VoiceHelper from '../services/voiceHelper';

export class DiscordBot {
    private client: Client;
    private voiceHelper: VoiceHelper;
    public playSoundCommand: PlayCommand;
    private superAdmins: string[];
    private prefixes: string[];
    private questionCommand: QuestionCommand;
    private readonly hostUrl: string;

    public get id(): string {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.client.user!.id;
    }

    constructor(private databaseHelper: DatabaseHelper, private fileHelper: FileHelper, private logger: Logger) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.prefixes = process.env.PREFIXES!.split(',');
        this.hostUrl = process.env.HOST!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.superAdmins = process.env.OWNERS!.split(',').map(owner => owner.trim()).filter(owner => owner);
        this.client = new Client({
            ws: {
                intents: [
                    Intents.NON_PRIVILEGED,
                    'GUILD_MEMBERS',
                ]
            }
        });
        this.setReady();
        this.setVoiceStateUpdate();
        this.setOnMessage();
        this.client.login(process.env.TOKEN);
        this.voiceHelper = new VoiceHelper(this, logger);
        this.playSoundCommand = new PlayCommand(logger, this.voiceHelper, databaseHelper, this.fileHelper);
        this.questionCommand = new QuestionCommand(logger, this.voiceHelper, this.databaseHelper, this.fileHelper);
    }

    private setReady() {
        this.client.on('ready', () => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            console.log(`Logged in as ${this.client.user!.tag}!`);
        });
    }

    public async fetchUserData(tokenData: { token_type: string, access_token: string }): Promise<UserObject> {
        const { data } = await axios.get('https://discord.com/api/users/@me', {
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

    public hasVoiceConnection(serverId: string): boolean {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.client.voice!.connections.has(serverId);
    }

    /**
     * 
     * @param serverId 
     * @returns `VoiceConnection` or `undefined`
     */
    public getVoiceConnection(serverId: string): VoiceConnection | undefined {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.client.voice!.connections.get(serverId);
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
                    this.playSoundCommand.playIntro(newState, serverInfo.defaultIntro);
                }
            }
            else {
                // user joins
                if (!oldUserChannelId) {
                    if (serverInfo.playIntro && (!serverInfo.minUser || newChannelMemberCount > 1)) {
                        this.playSoundCommand.playIntro(newState, serverInfo.defaultIntro);
                    }
                }
                // user leaves
                else if (!newUserChannelId) {
                    if (serverInfo.playOutro && serverInfo.defaultOutro && oldChannelMemberCount > 0) {
                        const soundMeta = await this.databaseHelper.getSoundMeta(serverInfo.defaultOutro);
                        if (soundMeta) {
                            this.playSoundCommand.playSound(oldState.guild.id, oldUserChannelId, soundMeta.path);
                        }
                        // else remove intro if not found?
                    }
                }
                // user switches channel
                else {
                    // 
                }

                // bot leaves if it is the only remaining member in the voice channel
                if (oldChannelMemberCount === 1 && oldState.id === this.id || newChannelMemberCount === 1 && newState.id === this.id) {
                    this.voiceHelper.disconnectVoice(oldState.guild.id);
                    return;
                }
            }
        });
    }

    private setOnMessage() {
        this.client.on('message', async (message: Message) => {
            // Will be changed because of slash-commmands


            let content = undefined;
            let prefixFound = false;
            const messageContent = message.content.toLocaleLowerCase().trim();
            for(let i = 0; i < this.prefixes.length; i++){
                if(messageContent.startsWith(this.prefixes[i]))
                {
                    content = message.content.substring(this.prefixes[i].length);
                    prefixFound = true;
                    break;
                }
            }

            if(!prefixFound && messageContent.startsWith(`<@${this.id}>`)){
                content = message.content.substring(this.id.length+3);
            }
            if(content){
                content = content.trim();
                if(this.playSoundCommand.isCommand(content))
                {
                    this.playSoundCommand.doWork(message);
                }
                else{
                    content = content.toLocaleLowerCase();
                    if(content.startsWith('list')){
                        message.reply(this.hostUrl);
                    }
                    else if(this.questionCommand.isCommand(content))
                    {
                        this.questionCommand.doWork(message);
                    }
                    else if(content === 'ping'){
                        message.reply('pong');
                    }
                    else if(content === 'leave'){
                        if(message.guild) {
                            const forceLock = PlayCommand.forcePlayLock.includes(message.guild.id);
                            if(forceLock){
                                if(await this.isUserAdminInServer(message.author.id,message.guild.id)){
                                    this.voiceHelper.disconnectVoice(message.guild.id);
                                };
                            }
                            else{
                                this.voiceHelper.disconnectVoice(message.guild.id);
                            }
                        }
                    }
                    else if(content === 'stop'){
                        if(message.guild){
                            this.playSoundCommand.stopPlaying(message.guild.id, this.isSuperAdmin(message.author.id));
                        }
                    }
                    else if(content === 'join'){
                        this.voiceHelper.joinVoiceChannel(message);
                    }
                    else if(content === 'flip'){
                        message.reply(Math.floor(Math.random()*2) == 0 ? 'Kopf' : 'Zahl');
                    }
                    else if (content.startsWith('pick')){
                        const elements = content.substring(4).split(',').map(item => item.trim()).filter(item => item.length !== 0);
                        if(elements.length !== 0) {
                            const index = Math.floor(Math.random()*elements.length-1);
                            message.reply(elements[index]);
                        }
                    }
                    else{
                        message.reply('Red Deitsch mit mir! I hob kan Plan wos du von mir wüllst!');
                    }
                }
            }
        });
    }
    public async getUserServers(userId: string): Promise<UserServerInformation[]> {
        const allServers: UserServerInformation[] = [];
        for (const guild of this.client.guilds.cache.array()) {
            const server: UserServerInformation | undefined = await this.getUserServer(await guild.fetch(), userId);
            if (server) {
                allServers.push(server);
            }
        }
        return allServers;
    }

    private async getGuildMember(guild: Guild, userId: string): Promise<GuildMember | null> {
        let member: GuildMember | null;
        try {
            member = await guild.members.fetch(userId);
        }
        catch {
            member = null;
        }
        return member;
    }

    private async getUserServer(guild: Guild, userId: string): Promise<UserServerInformation | undefined> {
        const member = await this.getGuildMember(guild, userId);
        let server: UserServerInformation | undefined;
        const isOwner = this.isSuperAdmin(userId);
        if (member) {
            server = new UserServerInformation(guild.id, guild.name, guild.icon, member.hasPermission('ADMINISTRATOR'), member.permissions.bitfield);
        }
        else if (isOwner) {
            server = new UserServerInformation(guild.id, guild.name, guild.icon, true, 0);
        }
        return server;
    }

    public async hasUserAdminServers(userId: string): Promise<boolean> {
        for (const guild of this.client.guilds.cache) {
            if(await this.isUserAdminInServer(userId, guild[0])){
                return true;
            }
        }
        return false;
    }

    public async getUsersWhereIsAdmin(userId: string, serverId: string): Promise<GuildMember[]> {
        let users: GuildMember[] = [];
        if(await this.isUserAdminInServer(userId, serverId)) {
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
        }
        catch {
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

    public async getServerName(serverId: string): Promise<string> {
        const server = await this.client.guilds.fetch(serverId);
        return server.name;
    }

    public isSuperAdmin(userId: string): boolean {
        return this.superAdmins.includes(userId);
    }

    public async getVoiceChannelsOfServer(serverId: string): Promise<{ id: Snowflake, name: string }[]> {
        const guild = await this.getServer(serverId);
        return guild?.channels.cache.array().filter(channel => channel.type === 'voice')
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
            users = (await guild.members.fetch()).array();
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
     * @param guild 
     * @param userId 
     * @returns the channelId the bot will join
     */
    public async getChannelIdThroughUser(joinToUser: boolean, serverId: string, channelId: string, userId: Snowflake): Promise<string | null> {
        let result: string | null = null;
        if (joinToUser) {
            const guild: Guild = await this.getServer(serverId);
            if (guild) {
                const member = await this.getGuildMember(guild, userId);
                if (member?.voice?.channelID) {
                    result = member.voice.channelID;
                }
            }
        }
        else {
            result = channelId;
        }
        return result;
    }

    public async mapUsernames(array: any[], key: string) {
        for (const userObject of array) {
            userObject.username = (await this.getSingleUser(userObject[key]))?.username;
        }
        array.sort((a,b) => a.username.localeCompare(b.username));
    }
}