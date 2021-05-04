import { Snowflake } from "discord.js";
import { Server } from "../models/Server";
import { SoundMeta } from "../models/SoundMeta";
import { UserObject } from "../models/UserObject";
import { UserPayload } from "../models/UserPayload";
import { UserToken } from "../models/UserToken";
import FileHelper from "./fileHelper";
import Logger from "./logger";

// const users = 'users';
// const sounds = 'sounds';
// const logs = 'log';
// const servers = 'servers';
// const settings = 'settings';
// const maxLogsReturned = 20;
// const maxLogsStored = 100;
// const maxLogsDeleted = 50;

// setDefault(){
//     let query = {};
//     query[users] = [];
//     query[sounds] = [];
//     query[logs] = [];
//     query[servers] = [];
//     query[settings] = [];
//     db.defaults(query).write();
// }

export class DatabaseHelper {

    constructor(private logger: Logger, private fileHelper: FileHelper){
        this.createTableIfNotExists();
    }

    private createTableIfNotExists(){

    }

    public async getUserToken(userId: string): Promise<UserToken> {
        return new UserToken();
    }

    async addUser(user: UserPayload, userToken: UserToken){
        // const userInfo = this.getUser(user.id);
        // if(!userInfo || !userInfo.info){
        //     const userClone = JSON.parse(JSON.stringify(user));//without reference
        //     let query = userInfo ? {...userInfo, ...userClone} : userClone;
        //     if(userInfo){
        //         db.get(users).find({id:user.id}).assign(query).write();
        //     }
        //     else{
        //         db.get(users).push(query).write();
        //     }
        // }
        // else{
        //     this.updateUserToken(user.id, user.info);
        // }
    }

    async addUserWithoutToken(user: any){
        // db.get(users).push(user).write();
    }

    async setIntro(userId: Snowflake, soundId: number, serverId: Snowflake){
        // if(!this.getUser(userId)){
        //     this.addUserWithoutToken({id: userId});
        // }
        // let query = {intros:{}};
        // query.intros[serverId] = soundId;
        // db.get(users).find({id: userId}).assign(query).write();
    }

    async getIntro(userId: Snowflake, serverId: Snowflake):Promise<number> {
        // let userInfo = this.getUser(userId);
        // return userInfo && userInfo.intros ? userInfo.intros[serverId] : undefined;
        return 0;
    }

    async addSoundsMeta(files: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[],user: string, category: string, serverId: Snowflake){
        // return files.map(file =>{
        //     return this.addSoundMeta(fileHelper.getFileName(file.filename), file.path, fileHelper.getFileName(file.originalname), user, category, serverId, serverName);
        // });
        return [];
    }

    async addSoundMeta(id: number, filePath: string, fileName: string, userId: Snowflake, category: string, serverId: Snowflake){
        // const query = {id: id, path: filePath, fileName: fileName, category: category, userId: userId, serverId: serverId, time: new Date().getTime()};
        // db.get(sounds).push(query).write();
        // this.logSoundUpload(query, serverName);
        // let {path, ...result} = query;
        // return result;
        return {id: id, path: filePath, fileName: fileName, category: category, userId: userId, serverId: serverId, time: new Date().getTime()};
    }

    async getSoundsMeta(servers: any[]){
        // return db.get(sounds).value().map(({ path, ...item }) => item).filter(meta => servers.some(server => server.id === meta.serverId)).sort((a,b) => a.fileName.localeCompare(b.fileName));
        return [];
    }

    async getSoundMeta(id: number): Promise<SoundMeta>{
        // return db.get(sounds).find({id: id}).value();
        return new SoundMeta(0,'','','','','');
    }

    async getSoundMetaByName(name: string): Promise<SoundMeta>{
        // return db.get(sounds).find({fileName: name}).value();
        return new SoundMeta(0,'','','','','');
    }

    async getSoundCategories(): Promise<string[]>{
        // return Array.from(new Set(db.get(sounds).value().map(meta => meta.category))).sort((a,b) => a.localeCompare(b));
        return [];
    }

    async removeSoundMeta(id: number, serverName: string){
        // this.logSoundDelete(getSoundMeta(id), serverName);
        // db.get(sounds).remove({id: id}).write();
    }

    async updateUserToken(id: Snowflake, info: UserToken){
        // db.get(users).find({id: id}).assign({info: info, time: new Date().getTime()}).write();
    }

    async removeUser(id: Snowflake){
        // db.get(users).remove({id: id}).write();
    }

    async getUser(id: Snowflake): Promise<UserObject>{
        return new UserObject();
        // return db.get(users).find({id: id}).value();
    }

    async getUsersInfo(users: any[], serverId: Snowflake){
        // return users.map(user =>{
        //     return this.getUserInfo(user, serverId);
        // });
    }

    async getUserInfo(user: any, serverId: Snowflake){
        // const userInfo = this.getUser(user.id);
        // user.intros = {};
        // if(userInfo && userInfo.intros){
        //     for(let serverId of Object.keys(userInfo.intros)){
        //         let intro = {id:''};
        //         const meta = this.getSoundMeta(userInfo.intros[serverId]);
        //         if(meta){
        //             intro = {
        //                 id: userInfo.intros[serverId],
        //                 fileName: meta.fileName
        //             };
        //         }
        //         user.intros[serverId] = intro;
        //     }
        // }
        // if(!user.intros){
        //     user.intros = {};
        // }
        // if(!user.intros[serverId]){
        //     user.intros[serverId] = {id:''};
        // }
        // return user;
        return null;
    }

    async logPlaySound(user: any, serverId: Snowflake, serverName: string, meta: any){
        // let query = {};
        // query.username = user.username;
        // query.message = 'Play Sound';
        // query.server = {
        //     id: serverId,
        //     name: serverName
        // };
        // query.fileId = meta.id;
        // query.fileName = meta.fileName;
        // log(query);
    }

    async log(query: any){
        // query.timestamp = Date.now();
        // let logData = this.getLogs();
        // if(logData.length > maxLogsStored){
        //     logData = logData.slice(logData.length-(maxLogsDeleted+1));
        //     logData.push(query);
        //     db.assign({log: logData}).write();
        // }
        // else{
        //     db.get(logs).push(query).write();
        // }
    }

    async logSoundUpload(soundMeta: any, serverName: string){
        this.log({username: soundMeta.user.name, message:'Sound Upload', fileName: soundMeta.fileName, fileId: soundMeta.id, server: {id: soundMeta.serverId, name: serverName}});
    }

    async logSoundDelete(soundMeta: any, serverName: string){
        this.log({username: soundMeta.user.name, message:'Sound Delete', fileName: soundMeta.fileName, fileId: soundMeta.id, server: {id: soundMeta.serverId, name: serverName}});
    }

    async getLogs(serverId: string, pageSize: number, pageKey: number){
        if(isNaN(pageSize) || isNaN(pageKey) || pageSize <= 0 || pageKey < 0) {

        }
    }

    async getLog(servers: Server[]){
        // let logsData = this.getLogs();
        
        // if(servers){
        //     logsData = logsData.filter(log => servers.some(server => server.id == log.server.id));
        // }
        
        // return logsData.slice(logsData.length > maxLogsReturned ? (logsData.length - (maxLogsReturned+1)): 0).sort((a,b) => (b.timestamp - a.timestamp));
        return [];
    }

    async getServersInfo(botServers: Server[]){
        return null;
        // botServers.map(server => this.getServerInfo(server.id) || server);
    }

    async getServerInfo(id: Snowflake): Promise<Server>{
        return new Server();
        // db.get(servers).find({id: id}).value();
    }

    async udpateServerInfo(serverInfo: Server){
        // if(this.getServerInfo(serverInfo.id)){
        //     db.get(servers).find({id: serverInfo.id}).assign(serverInfo).write();
        // }
        // else{
        //     db.get(servers).push(serverInfo).write();
        // }
    }
}