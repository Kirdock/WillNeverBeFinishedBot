import { Snowflake } from 'discord.js';
import { ServerSettings } from '../models/ServerSettings';
import { SoundMeta } from '../models/SoundMeta';
import { UserToken } from '../models/UserToken';
import { Db, DeleteWriteOpResultObject, InsertOneWriteOpResult, MongoClient, ObjectID, UpdateWriteOpResult } from 'mongodb';
import FileHelper from './fileHelper';
import Logger from './logger';
import { User } from '../models/User';
import { ErrorTypes } from './ErrorTypes';
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
    private client: MongoClient;
    private database!: Db;
    private readonly userCollectionName: string = 'users';
    private readonly serverInfoCollectionName: string = 'servers';
    private readonly soundMetaCollectionName: string = 'sounds';

    constructor(private logger: Logger, private fileHelper: FileHelper){
        this.client = new MongoClient(`mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@127.0.0.1:27017?retryWrites=true&writeConcern=majority`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }

    private get userCollection() {
        return this.database.collection(this.userCollectionName);
    }

    private get soundMetaCollection() {
        return this.database.collection(this.soundMetaCollectionName);
    }

    private get serverInfoCollection() {
        return this.database.collection(this.serverInfoCollectionName);
    }

    public async run(): Promise<void> {
        await this.client.connect();
        this.database = this.client.db(process.env.DATABASE_NAME);
        await this.soundMetaCollection.createIndex({'category': 1});
    }

    public async getUserToken(userId: string): Promise<UserToken> {
        const user = await this.userCollection.findOne<User>({id: userId},{fields: {token: 1}});
        if(!user?.token) {
            throw ErrorTypes.TOKEN_NOT_FOUND;
        }

        return user.token;
    }

    public async updateUserToken(userId: Snowflake, info: UserToken): Promise<UpdateWriteOpResult>{
        info.time = new Date().getTime();
        return this.userCollection.updateOne({id: userId}, {token: info}, {upsert: true});
    }

    async setIntro(userId: Snowflake, soundId: ObjectID, serverId: Snowflake): Promise<UpdateWriteOpResult>{
        const updateQuery: {[key: string]: ObjectID} = {};
        updateQuery[serverId] = soundId;
        return this.userCollection.updateOne({id: userId}, {intros: updateQuery}, {upsert: true});
    }

    async getIntro(userId: Snowflake, serverId: Snowflake):Promise<ObjectID| undefined> {
        const projection: {[key: string]: number} = {};
        projection[serverId] = 1;
        projection.id = 1;
        const user = await this.userCollection.findOne<User>({id: userId}, {fields: projection})
        return user?.intros?.[serverId];
    }

    async addSoundsMeta(files: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[], userId: Snowflake, category: string, serverId: Snowflake): Promise<SoundMeta[]>{
        const preparedFiles: Express.Multer.File[] = this.fileHelper.getFiles(files);
        const soundsMeta: SoundMeta[] = preparedFiles.map(file => new SoundMeta(file.path, file.filename, category, userId, serverId));
        await this.soundMetaCollection.insertMany(soundsMeta);
        return soundsMeta;
    }

    async addSoundMeta(id: ObjectID, filePath: string, fileName: string, userId: Snowflake, category: string, serverId: Snowflake): Promise<InsertOneWriteOpResult<SoundMeta>>{
        const soundMeta = new SoundMeta(filePath, fileName, category, userId, serverId);
        soundMeta._id = id;
        return this.soundMetaCollection.insertOne(soundMeta);
    }

    async getSoundsMeta(servers: Snowflake[], fromTime?: string): Promise<SoundMeta[]>{
        const query: any = {serverId: {$in: servers}};
        if(fromTime) {
            query.fromTime = { $gte : fromTime };
        }
        return this.soundMetaCollection.find(query).toArray();
    }

    async getSoundMeta(id: ObjectID): Promise<SoundMeta | undefined>{
        return this.soundMetaCollection.findOne({_id: id});
    }

    async getSoundMetaByName(fileName: string): Promise<SoundMeta | undefined>{
        return this.soundMetaCollection.findOne({fileName});
    }

    async getSoundCategories(): Promise<string[]>{
        return (await this.soundMetaCollection.distinct('category')).sort((a,b) => a.localeCompare(b));
    }

    async removeSoundMeta(id: ObjectID): Promise<DeleteWriteOpResultObject>{
        return this.soundMetaCollection.deleteOne({_id: id});
    }

    async getUsersInfo(users: Snowflake[], serverId: Snowflake): Promise<User[]>{
        return this.userCollection.find(
            {
                id: 
                {
                    $in: users
                },
                intros: serverId
            },
            {
                fields:
                {
                    intros: 1,
                    id: 1
                }
            }).toArray();
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
        // if(isNaN(pageSize) || isNaN(pageKey) || pageSize <= 0 || pageKey < 0) {
        // }
    }

    async getLog(servers: ServerSettings[]){
        // let logsData = this.getLogs();
        
        // if(servers){
        //     logsData = logsData.filter(log => servers.some(server => server.id == log.server.id));
        // }
        
        // return logsData.slice(logsData.length > maxLogsReturned ? (logsData.length - (maxLogsReturned+1)): 0).sort((a,b) => (b.timestamp - a.timestamp));
        return [];
    }

    async getServerInfo(serverId: Snowflake): Promise<ServerSettings>{
        return this.serverInfoCollection.findOne({id: serverId});
    }

    async udpateServerInfo(serverInfo: ServerSettings): Promise<UpdateWriteOpResult>{
        const {id, ...data} = serverInfo;
        return this.serverInfoCollection.updateOne({id}, data, {upsert: true});
    }
}