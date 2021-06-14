import axios from 'axios';
import { GuildMemberManager, User } from 'discord.js';
import { Client, Collection, Guild, GuildMember, Message, Snowflake, VoiceConnection, VoiceState } from 'discord.js';
import { ServerSettings } from '../models/ServerSettings';
import { UserObject } from '../models/UserObject';
import { UserServerInformation } from '../models/UserServerInformation';
import { PlayCommand } from '../modules/playSound';
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

    public get id(): string {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.client.user!.id;
    }

    constructor(private databaseHelper: DatabaseHelper, private fileHelper: FileHelper, private logger: Logger) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.prefixes = process.env.PREFIXES!.split(',');
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.superAdmins = process.env.OWNERS!.split(',').map(owner => owner.trim()).filter(owner => owner);
        this.client = new Client();
        this.setReady();
        this.setVoiceStateUpdate();
        this.setOnMessage();
        this.client.login(process.env.TOKEN);
        this.voiceHelper = new VoiceHelper(this, logger);
        this.playSoundCommand = new PlayCommand(logger, this.voiceHelper, databaseHelper, this.fileHelper);
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
            const serverInfo: ServerSettings = await this.databaseHelper.getServerInfo(newState.guild.id);

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
        this.client.on('message', (message: Message) => {
            // Will be changed because of slash-commmands


            // let content = undefined;
            // let prefixFound = false;
            // const messageContent = message.content.toLocaleLowerCase().trim();
            // for(let i = 0; i < prefixes.length; i++){
            //     if(messageContent.startsWith(prefixes[i]))
            //     {
            //         content = message.content.substring(prefixes[i].length);
            //         prefixFound = true;
            //         break;
            //     }
            // }

            // if(!prefixFound && messageContent.startsWith(`<@${Config.clientId}>`)){
            //     content = message.content.substring(Config.clientId.length+3);
            // }
            // if(content){

            //     content = content.trim();
            //     if(this.playSoundCommand.isCommand(content))
            //     {
            //         this.playSoundCommand.doWork(message, content);
            //     }
            //     else{
            //         content = content.toLocaleLowerCase();
            //         if(listCommand.isCommand(content)){
            //             message.reply('https://kirdock.synology.me:4599/');
            //         }
            //         else if(questionCommand.isCommand(content))
            //         {
            //             questionCommand.doWork(content, message);
            //         }
            //         else if(content === 'ping'){
            //             message.reply('pong');
            //         }
            //         else if(content === 'leave'){
            //             const forceLock = this.databaseHelper.getForceLock(message.guild.id);
            //             if(forceLock){
            //                 clientHelper.isUserAdminInServer(message.author.id,message.guild.id).then(guild=>{
            //                     if(guild){
            //                         this.voiceHelper.disconnectVoice(message.guild.id);
            //                     }
            //                 });
            //             }
            //             else{
            //                 this.voiceHelper.disconnectVoice(message.guild.id);
            //             }

            //         }
            //         else if(content === 'stop'){
            //             clientHelper.isUserAdminInServer(message.author.id,message.guild.id).then(guild=>{
            //                 this.playSoundCommand.stopPlaying(message.guild.id, !!guild);
            //             }).catch(()=>{
            //                 this.playSoundCommand.stopPlaying(message.guild.id);
            //             })
            //         }
            //         else if(content === 'join'){
            //             this.voiceHelper.joinVoiceChannel(message);
            //         }
            //         else if(content === 'flip'){
            //             message.reply(Math.floor(Math.random()*2) == 0 ? 'Kopf' : 'Zahl');
            //         }
            //         else{
            //             message.reply('Red Deitsch mit mir! I hob kan Plan wos du von mir wüllst!');
            //         }
            //     }
            // }
        });
    }
    public async getUserServers(userId: string): Promise<UserServerInformation[]> {
        const allServers: UserServerInformation[] = [];
        for await (const guild of this.client.guilds.cache) {
            const server: UserServerInformation | undefined = await this.getUserServer(guild[1], userId);
            if (server) {
                allServers.push(server);
            }
        }
        return allServers;
    }

    private async getUserServer(guild: Guild, userId: string): Promise<UserServerInformation | undefined> {
        const member = await guild.members.fetch(userId);
        let server: UserServerInformation | undefined;
        const isOwner = this.isSuperAdmin(userId);
        if (member) {
            // const serverInfo: ServerSettings | object = isAdmin ? this.databaseHelper.getServerInfo(guild.id) : {}
            server = new UserServerInformation(guild.id, guild.name, guild.icon, member.permissions.has('ADMINISTRATOR'), member.permissions.bitfield);
        }
        else if (isOwner) {
            server = new UserServerInformation(guild.id, guild.name, guild.icon, true, 0);
        }
        return server;
    }

    public async hasUserAdminServers(userId: string): Promise<boolean> {
        const result = await this.getUserServers(userId);
        return result.some(server => server.isAdmin);
    }

    public async getUsersWhereIsAdmin(userId: string): Promise<GuildMember[]> {
        const servers = await this.getServersWhereAdmin(userId);
        return (await Promise.all(
            servers.map(guild => guild.members)
                .reduce((a: GuildMember[], b: GuildMemberManager) => [...a, ...b.cache.values()], []) // return all members (select many)
        )).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    private async getServersWhereAdmin(userId: string): Promise<Collection<string, Guild>> {
        let servers: Collection<string, Guild> = new Collection<string, Guild>();
        if (this.isSuperAdmin(userId)) {
            servers = this.client.guilds.cache;
        }
        else {
            for await (const guild of this.client.guilds.cache) {
                if (await this.isUserAdminInServer(userId, guild[1].id)) {
                    const server = await this.getServer(guild[1].id);
                    servers.set(server.id, server);
                }
            }
        }
        return servers;
    }

    public async isUserAdminInServer(userId: string, serverId: string): Promise<boolean> {
        let status: boolean;
        try {
            const guild = await this.client.guilds.fetch(serverId);
            const member = await guild.members.fetch(userId);
            status = member.permissions.has('ADMINISTRATOR');
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
        return guild?.channels.cache.filter(channel => channel.type === 'voice')
            .sort((channel1, channel2) => channel1.rawPosition - channel2.rawPosition)
            .map(item => {
                return {
                    id: item.id,
                    name: item.name
                }
            }) ?? [];
    }

    public async getUsers(serverId: string): Promise<GuildMember[]> {
        const guild: Guild = await this.client.guilds.fetch(serverId);
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
                try {
                    const member = await guild.members.fetch(userId);
                    result = !!member;
                }
                catch {
                    result = false;
                }
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
    public async getChannelIdThroughUser(joinToUser: boolean, serverId: string, channelId: string, guild: Guild, userId: Snowflake): Promise<string | null> {
        let result: string | null = null;
        if (joinToUser) {
            if (guild) {
                const member = await guild.members.fetch(userId);
                if (member.guild.id === serverId && member.voice?.channel) {
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
    }
}