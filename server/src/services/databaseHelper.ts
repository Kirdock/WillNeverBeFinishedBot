import { Snowflake } from 'discord.js';
import { createServerSettings } from '../models/ServerSettings';
import { IUserToken } from '../interfaces/UserToken';
import { Collection, Db, DeleteResult, Document, Filter, FindOptions, InsertManyResult, InsertOneResult, MongoClient, ObjectId, UpdateFilter, UpdateResult } from 'mongodb';
import { FileHelper } from './fileHelper';
import { createUser } from '../models/User';
import { ErrorTypes } from './ErrorTypes';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { IDatabaseMetadata } from '../interfaces/database-metadata';
import { MigratorHelper } from './migratorHelper';
import { createLog } from '../models/Log';
import { ILog } from '../interfaces/log';
import { IServerSettings } from '../../../shared/interfaces/server-settings';
import { IUser } from '../interfaces/user';
import { ISoundMeta } from '../interfaces/sound-meta';
import { createSoundMeta } from '../models/SoundMeta';

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

    constructor(config: IEnvironmentVariables) {
        this.version = config.VERSION;
        this.migratorHelper = new MigratorHelper(this, this.version);
        this.client = new MongoClient(`mongodb://${config.DATABASE_USER}:${config.DATABASE_PASSWORD}@${config.DATABASE_CONTAINER_NAME}:27017`,
            {
                retryWrites: true,
                w: 'majority',
            });
    }

    private get userCollection(): Collection<IUser> {
        return this.database.collection(this.userCollectionName);
    }

    private get soundMetaCollection(): Collection<ISoundMeta> {
        return this.database.collection(this.soundMetaCollectionName);
    }

    private get serverInfoCollection(): Collection<IServerSettings> {
        return this.database.collection(this.serverInfoCollectionName);
    }

    private get logCollection(): Collection<ILog> {
        return this.database.collection(this.logCollectionName);
    }

    private get metadataCollection(): Collection<IDatabaseMetadata> {
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
        return await this.metadataCollection.findOne({}) ?? {
            version: '0.1.0'
        };
    }

    private timeToObjectID(time: number): ObjectId {
        return new ObjectId(Math.floor(time / 1000).toString(16) + "0000000000000000");
    }

    public async getUserToken(userId: string): Promise<IUserToken> {
        const user = await this.userCollection.findOne({id: userId}, {projection: {token: 1, id: 1, _id: 1}});
        if (!user?.token) {
            throw new Error(ErrorTypes.TOKEN_NOT_FOUND);
        }

        return {...user.token, userId: user.id, _id: user._id};
    }

    public async updateUserToken(userId: Snowflake, info: IUserToken): Promise<ObjectId | undefined> {
        info.time = new Date().getTime();
        return (await this.userCollection.findOneAndUpdate({id: userId}, {$set: {'token': info}},
            {
                upsert: true,
                returnDocument: 'after',
                projection: {
                    _id: 1
                }
            }
        )).value?._id;
    }

    public setIntro(userId: Snowflake, soundId: ObjectId, serverId: Snowflake): Promise<UpdateResult> {
        // @ts-ignore
        const updateFilter: UpdateFilter<IUser> = {$set: {[`intros.${serverId}`]: soundId}};
        return this.userCollection.updateOne({id: userId}, updateFilter, {upsert: true});
    }

    async getIntro(userId: Snowflake, serverId: Snowflake): Promise<string | undefined> {
        const projection: FindOptions<IUser> =
            {
                projection: {
                    intros: {
                        [serverId]: 1
                    },
                    _id: 0
                }
            };

        const user = await this.userCollection.findOne<IUser>({id: userId}, projection);
        return user?.intros?.[serverId]?.toString();
    }

    async addSoundsMeta(files: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[], userId: Snowflake, category: string, serverId: Snowflake): Promise<ISoundMeta[]> {
        const preparedFiles: Express.Multer.File[] = FileHelper.getFiles(files);
        await FileHelper.normalizeFiles(preparedFiles);
        const soundsMeta: ISoundMeta[] = preparedFiles.map(file => createSoundMeta(file.path, FileHelper.getFileName(file.originalname), category, userId, serverId));
        this.logSoundUpload(soundsMeta);
        await this.soundMetaCollection.insertMany(soundsMeta);
        this.mapTime(soundsMeta);
        return soundsMeta;
    }

    async addSoundMeta(id: ObjectId, filePath: string, fileName: string, userId: Snowflake, category: string, serverId: Snowflake): Promise<ISoundMeta> {
        const ISoundMeta = createSoundMeta(filePath, fileName, category, userId, serverId);
        ISoundMeta._id = id;
        await this.soundMetaCollection.insertOne(ISoundMeta);
        this.mapTime([ISoundMeta]);
        return ISoundMeta;
    }

    async getSoundsMeta(servers: Snowflake[], fromTime?: number): Promise<ISoundMeta[]> {
        const query: Filter<ISoundMeta> = {
            serverId: {$in: servers},
            ...(fromTime && {_id: {$gt: this.timeToObjectID(fromTime)}})
        };
        const soundsMeta = await this.soundMetaCollection.find<ISoundMeta>(query).toArray();
        this.mapTime(soundsMeta);
        return soundsMeta;
    }

    async getSoundMeta(id: string): Promise<ISoundMeta | undefined> {
        const ISoundMeta: ISoundMeta | null = await this.soundMetaCollection.findOne({_id: new ObjectId(id)});
        if (ISoundMeta) {
            this.mapTime([ISoundMeta]);
        }
        return ISoundMeta ?? undefined;
    }

    async getSoundMetaByName(fileName: string): Promise<ISoundMeta | undefined> {
        const ISoundMeta: ISoundMeta | null = await this.soundMetaCollection.findOne({fileName});
        if (ISoundMeta) {
            this.mapTime([ISoundMeta]);
        }
        return ISoundMeta ?? undefined;
    }

    async getSoundCategories(): Promise<string[]> {
        return (await this.soundMetaCollection.distinct('category')).sort((a, b) => a.localeCompare(b));
    }

    async removeSoundMeta(id: string): Promise<DeleteResult> {
        return this.soundMetaCollection.deleteOne({_id: new ObjectId(id)});
    }

    async getUsersInfo(users: Snowflake[], serverId: Snowflake): Promise<IUser[]> {
        const usersWithoutInfo: IUser[] = [];
        const userInfos: IUser[] = await this.userCollection.find(
            // @ts-ignore
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

        for (const userId of users) {
            if (!userInfos.some(u => u.id === userId)) {
                const newUser = createUser(userId);
                usersWithoutInfo.push(newUser);
            }
        }
        userInfos.push(...usersWithoutInfo);
        return userInfos;
    }

    private logSound(userId: Snowflake, meta: ISoundMeta, message: string): Promise<InsertOneResult<ILog>> {
        return this.log(createLog(meta.serverId, userId, message, {fileName: meta.fileName, id: meta._id}));
    }

    async logPlaySound(userId: Snowflake, meta: ISoundMeta): Promise<InsertOneResult<ILog>> {
        return this.logSound(userId, meta, 'Play Sound');
    }

    private async logSoundUpload(soundMetas: ISoundMeta[]): Promise<InsertManyResult<Document>> {
        const logs = soundMetas.map(meta => createLog(meta.serverId, meta.userId, 'Sound Upload', {fileName: meta.fileName, id: meta._id}));
        return this.logCollection.insertMany(logs);
    }

    async logSoundDelete(userId: Snowflake, ISoundMeta: ISoundMeta): Promise<InsertOneResult<ILog>> {
        return this.logSound(userId, ISoundMeta, 'Sound Delete');
    }

    async log(log: ILog): Promise<InsertOneResult<ILog>> {
        return this.logCollection.insertOne(log);
    }

    async getLogs(serverId: string, pageSize: number, pageKey: number, fromTime: number): Promise<ILog[]> {
        const findQuery: Filter<ILog> = {
            serverId
        };
        const query: FindOptions<ILog> = {
            ...(pageSize && pageKey && pageSize > 0 && pageKey >= 0 &&
                {
                    limit: pageSize,
                    skip: pageKey * pageSize
                }
            ),
            ...(fromTime && {time: {$gte: fromTime}})
        };

        return await this.logCollection.find(
            findQuery,
            query
        ).toArray();
    }

    async getServerSettings(serverId: Snowflake): Promise<IServerSettings> {
        const result: IServerSettings | null = await this.serverInfoCollection.findOne({id: serverId},
            {
                projection: {
                    _id: 0
                }
            });
        return result ?? createServerSettings(serverId);
    }

    async updateServerSettings(serverInfo: IServerSettings): Promise<UpdateResult> {
        const {id, ...data} = serverInfo;
        return this.serverInfoCollection.updateOne({id}, {$set: {...data}}, {upsert: true});
    }

    private mapTime(soundsMeta: { time?: number, _id: ObjectId }[]): void {
        for (const ISoundMeta of soundsMeta) {
            ISoundMeta.time = ISoundMeta._id.getTimestamp().getTime();
        }
    }
}