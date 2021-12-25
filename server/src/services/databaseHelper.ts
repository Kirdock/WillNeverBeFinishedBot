import { Snowflake } from 'discord.js';
import { ServerSettings } from '../models/ServerSettings';
import { SoundMeta } from '../models/SoundMeta';
import { UserToken } from '../models/UserToken';
import {
    Db,
    DeleteWriteOpResultObject,
    FilterQuery,
    FindOneOptions,
    InsertOneWriteOpResult,
    InsertWriteOpResult,
    MongoClient,
    ObjectID,
    UpdateWriteOpResult
} from 'mongodb';
import { FileHelper } from './fileHelper';
import { Logger } from './logger';
import { User } from '../models/User';
import { ErrorTypes } from './ErrorTypes';
import { Log } from '../models/Log';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { IDatabaseMetadata } from '../interfaces/database-metadata';
import semver from 'semver/preload';
import { MigratorHelper } from './migratorHelper';

export class DatabaseHelper {
    private client: MongoClient;
    private database!: Db;
    private readonly migratorHelper: MigratorHelper;
    private readonly version: string;
    private readonly metadataCollectionName = 'metadata';
    private readonly userCollectionName: string = 'users';
    private readonly serverInfoCollectionName: string = 'servers';
    private readonly soundMetaCollectionName: string = 'sounds';
    private readonly logCollectionName: string = 'logs';

    constructor(private logger: Logger, private fileHelper: FileHelper, config: IEnvironmentVariables){
        this.version = config.VERSION;
        this.migratorHelper = new MigratorHelper(this, logger, this.version);
        this.client = new MongoClient(`mongodb://${config.DATABASE_USER}:${config.DATABASE_PASSWORD}@${config.DATABASE_CONTAINER_NAME}:27017?retryWrites=true`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            writeConcern: 'majority',
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

    private get logCollection() {
        return this.database.collection(this.logCollectionName);
    }

    private get metadataCollection() {
        return this.database.collection(this.metadataCollectionName);
    }

    public async run(config: IEnvironmentVariables): Promise<void> {
        await this.client.connect();
        this.database = this.client.db(config.DATABASE_NAME);
        await this.soundMetaCollection.createIndex({'category': 1});
        await this.userCollection.createIndex({'id': 1});
        await this.serverInfoCollection.createIndex({'id': 1});
        await this.migratorHelper.migrateCheck();
    }

    public async getVersion(): Promise<string> {
        const metadata = await this.getDatabaseMetadata();
        return metadata.version;
    }

    public async setVersion(version: string): Promise<void> {
        await this.metadataCollection.updateOne({},
            {
                $set:
                    {
                        version
                    }
                },
                {
                    upsert: true
                }
            );
    }

    private async getDatabaseMetadata(): Promise<IDatabaseMetadata> {
        return await this.metadataCollection.findOne<IDatabaseMetadata>({}) ?? {
            version: '0.1.0'
        };
    }

    private timeToObjectID(time: number): ObjectID {
        return new ObjectID(Math.floor(time / 1000).toString(16) + "0000000000000000");
    }

    public async getUserToken(userId: string): Promise<UserToken> {
        const user = await this.userCollection.findOne<User>({id: userId},{projection: {token: 1, id: 1, _id: 1}});
        if(!user?.token) {
            throw ErrorTypes.TOKEN_NOT_FOUND;
        }

        return {...user.token, userId: user.id, _id: user._id};
    }

    public async updateUserToken(userId: Snowflake, info: UserToken): Promise<ObjectID>{
        info.time = new Date().getTime();
        return (await this.userCollection.findOneAndUpdate({id: userId}, {$set: {token: info}},
            {
                upsert: true,
                returnDocument: 'after',
                projection: {
                    _id: 1
                }
            }
        )).value._id;
    }

    async setIntro(userId: Snowflake, soundId: ObjectID, serverId: Snowflake): Promise<UpdateWriteOpResult>{
        return this.userCollection.updateOne({id: userId}, {$set: {intros: {[serverId]: soundId}}}, {upsert: true});
    }

    async getIntro(userId: Snowflake, serverId: Snowflake):Promise<string | undefined> {
        const projection: FindOneOptions<User> =
        {
            projection: {
                intros:{
                    [serverId]: 1
                },
                _id: 0
            }
        };
        
        const user = await this.userCollection.findOne<User>({id: userId}, projection);
        return user?.intros?.[serverId];
    }

    async addSoundsMeta(files: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[], userId: Snowflake, category: string, serverId: Snowflake): Promise<SoundMeta[]>{
        const preparedFiles: Express.Multer.File[] = this.fileHelper.getFiles(files);
        await this.fileHelper.normalizeFiles(preparedFiles);
        const soundsMeta: SoundMeta[] = preparedFiles.map(file => new SoundMeta(file.path, this.fileHelper.getFileName(file.originalname), category, userId, serverId));
        this.logSoundUpload(soundsMeta);
        await this.soundMetaCollection.insertMany(soundsMeta);
        this.mapTime(soundsMeta);
        return soundsMeta;
    }

    async addSoundMeta(id: ObjectID, filePath: string, fileName: string, userId: Snowflake, category: string, serverId: Snowflake): Promise<SoundMeta>{
        const soundMeta = new SoundMeta(filePath, fileName, category, userId, serverId);
        soundMeta._id = id;
        await this.soundMetaCollection.insertOne(soundMeta);
        this.mapTime([soundMeta]);
        return soundMeta;
    }

    async getSoundsMeta(servers: Snowflake[], fromTime?: number): Promise<SoundMeta[]>{
        const query: FilterQuery<SoundMeta> = {
            serverId: {$in: servers},
            ...(fromTime && { _id: { $gt: this.timeToObjectID(fromTime)}})
        };
        const soundsMeta: SoundMeta[] = await this.soundMetaCollection.find(query).toArray();
        this.mapTime(soundsMeta);
        return soundsMeta;
    }

    async getSoundMeta(id: string): Promise<SoundMeta | undefined>{
        const soundMeta: SoundMeta | undefined = await this.soundMetaCollection.findOne({_id: new ObjectID(id)});
        if(soundMeta) {
            this.mapTime([soundMeta]);
        }
        return soundMeta;
    }

    async getSoundMetaByName(fileName: string): Promise<SoundMeta | undefined>{
        const soundMeta: SoundMeta | undefined = await this.soundMetaCollection.findOne({fileName});
        if(soundMeta) {
            this.mapTime([soundMeta]);
        }
        return soundMeta;
    }

    async getSoundCategories(): Promise<string[]>{
        return (await this.soundMetaCollection.distinct('category')).sort((a,b) => a.localeCompare(b));
    }

    async removeSoundMeta(id: string): Promise<DeleteWriteOpResultObject>{
        return this.soundMetaCollection.deleteOne({_id: new ObjectID(id)});
    }

    async getUsersInfo(users: Snowflake[], serverId: Snowflake): Promise<User[]>{
        const usersWithoutInfo: User[] = [];
        const userInfos: User[] = await this.userCollection.find(
            {
                id: 
                {
                    $in: users
                },
                [`intros.${serverId}`]: {$exists: true}
            },
            {
                projection:
                {
                    intros: 1,
                    id: 1,
                    _id: 0
                }
            }).toArray();

        for(const userId of users) {
            if(!userInfos.some(u => u.id === userId)){
                const newUser = new User(userId);
                usersWithoutInfo.push(newUser);
            }
        }
        userInfos.push(...usersWithoutInfo);
        return userInfos;
    }

    private logSound(userId: Snowflake, meta: SoundMeta, message: string) {
        return this.log(new Log(meta.serverId, userId, message, {fileName: meta.fileName, id: meta._id}));
    }

    async logPlaySound(userId: Snowflake, meta: SoundMeta): Promise<InsertOneWriteOpResult<Log>>{
        return this.logSound(userId, meta, 'Play Sound');
    }

    private async logSoundUpload(soundMetas: SoundMeta[]): Promise<InsertWriteOpResult<any>>{
        const logs = soundMetas.map(meta => new Log(meta.serverId, meta.userId, 'Sound Upload', {fileName: meta.fileName, id: meta._id}));
        return this.logCollection.insertMany(logs);
    }

    async logSoundDelete(userId: Snowflake, soundMeta: SoundMeta): Promise<InsertOneWriteOpResult<Log>>{
        return this.logSound(userId, soundMeta, 'Sound Delete');
    }

    async log(log: Log): Promise<InsertOneWriteOpResult<Log>>{
        return this.logCollection.insertOne(log);
    }

    async getLogs(serverId: string, pageSize: number, pageKey: number, fromTime: number): Promise<Log[]>{
        const findQuery: FilterQuery<Log> = {
            serverId
        };
        const query: FindOneOptions<Log> = {
            ...(pageSize && pageKey && pageSize > 0 && pageKey >= 0 &&
                {
                    limit: pageSize,
                    skip: pageKey * pageSize
                }
            ),
            ...(fromTime && {time: { $gte: fromTime }})
        };
        
        return await this.logCollection.find<Log>(
            findQuery,
            query
            ).toArray();
    }

    async getServerSettings(serverId: Snowflake): Promise<ServerSettings>{
        let result: ServerSettings | null = await this.serverInfoCollection.findOne<ServerSettings>({id: serverId},
            {
                projection: {
                    _id: 0
                }
            });
        if(!result){
            result = new ServerSettings(serverId);
        }
        return result;
    }

    async udpateServerSettings(serverInfo: ServerSettings): Promise<UpdateWriteOpResult>{
        const {id, ...data} = serverInfo;
        return this.serverInfoCollection.updateOne({id}, {$set: {...data}}, {upsert: true});
    }

    private mapTime(soundsMeta: {time?: number, _id: ObjectID}[]): void {
        for(const soundMeta of soundsMeta) {
            soundMeta.time = soundMeta._id.getTimestamp().getTime();
        }
    }
}