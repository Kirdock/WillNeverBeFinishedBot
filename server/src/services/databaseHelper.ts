import type { Snowflake } from 'discord.js';
import { createServerSettings } from '../utils/ServerSettings';
import type { IUserToken } from '../interfaces/UserToken';
import type {
    Collection,
    Db,
    DeleteResult,
    Document,
    Filter,
    FindOptions,
    InsertManyResult,
    InsertOneResult,
    UpdateFilter,
    UpdateResult
} from 'mongodb';
import {
    MongoClient,
    ObjectId
} from 'mongodb';
import { createUser } from '../utils/User';
import { ErrorTypes } from './ErrorTypes';
import type { IDatabaseMetadata } from '../interfaces/database-metadata';
import { createLog } from '../models/Log';
import type { ILog } from '../interfaces/log';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';
import type { IUser } from '../interfaces/user';
import type { ISoundMeta } from '../interfaces/sound-meta';
import { createSoundMeta } from '../utils/SoundMeta';
import type { IUserVoiceSettings } from '../../../shared/interfaces/user-voice-settings';
import { EnvironmentConfig } from './config';
import { fileHelper } from './fileHelper';


export class DatabaseHelper {
    protected client: MongoClient;
    private database!: Db;
    private readonly version: string;
    private readonly metadataCollectionName = 'metadata';
    private readonly userCollectionName: string = 'users';
    private readonly serverInfoCollectionName: string = 'servers';
    private readonly soundMetaCollectionName: string = 'sounds';
    private readonly logCollectionName: string = 'logs';
    private readonly databaseName: string;

    constructor() {
        this.version = EnvironmentConfig.VERSION;
        this.databaseName = EnvironmentConfig.DATABASE_NAME;
        this.client = new MongoClient(`mongodb://${EnvironmentConfig.DATABASE_USER}:${EnvironmentConfig.DATABASE_PASSWORD}@${EnvironmentConfig.DATABASE_CONTAINER_NAME}:27017`,
            {
                retryWrites: true,
                writeConcern: {
                    w: 'majority'
                },
            });
    }

    protected get userCollection(): Collection<IUser> {
        return this.database.collection(this.userCollectionName);
    }

    protected get soundMetaCollection(): Collection<ISoundMeta> {
        return this.database.collection(this.soundMetaCollectionName);
    }

    protected get serverInfoCollection(): Collection<IServerSettings> {
        return this.database.collection(this.serverInfoCollectionName);
    }

    protected get logCollection(): Collection<ILog> {
        return this.database.collection(this.logCollectionName);
    }

    protected get metadataCollection(): Collection<IDatabaseMetadata> {
        return this.database.collection(this.metadataCollectionName);
    }

    public async run(): Promise<void> {
        await this.client.connect();
        this.database = this.client.db(this.databaseName);
        await this.soundMetaCollection.createIndex({ 'category': 1 });
        await this.userCollection.createIndex({ 'id': 1 });
        await this.serverInfoCollection.createIndex({ 'id': 1 });
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
        return new ObjectId(Math.floor(time / 1000).toString(16) + '0000000000000000');
    }

    public async getUserToken(userId: string): Promise<IUserToken> {
        const user = await this.userCollection.findOne({ id: userId }, { projection: { token: 1, id: 1, _id: 1 } });
        if (!user?.token) {
            throw new Error(ErrorTypes.TOKEN_NOT_FOUND);
        }

        return { ...user.token, userId: user.id, _id: user._id };
    }

    public async updateUserToken(userId: Snowflake, info: IUserToken): Promise<ObjectId | undefined> {
        info.time = new Date().getTime();
        return (await this.userCollection.findOneAndUpdate({ id: userId }, { $set: { 'token': info } },
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
        const updateFilter: UpdateFilter<IUser> = { $set: { [`intros.${serverId}`]: soundId } };
        return this.userCollection.updateOne({ id: userId }, updateFilter, { upsert: true });
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

        const user = await this.userCollection.findOne<IUser>({ id: userId }, projection);
        return user?.intros[serverId]?.toString();
    }

    async addSoundsMeta(files: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[], userId: Snowflake, category: string, serverId: Snowflake): Promise<ISoundMeta[]> {
        const preparedFiles: Express.Multer.File[] = fileHelper.getFiles(files);
        await fileHelper.normalizeFiles(preparedFiles);
        const soundsMeta: ISoundMeta[] = preparedFiles.map(file => createSoundMeta(file.path, fileHelper.getFileName(file.originalname), category, userId, serverId));
        void this.logSoundUpload(soundsMeta);
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
            serverId: { $in: servers },
            ...(fromTime && { _id: { $gt: this.timeToObjectID(fromTime) } })
        };
        const soundsMeta = await this.soundMetaCollection.find<ISoundMeta>(query).toArray();
        this.mapTime(soundsMeta);
        return soundsMeta;
    }

    async getSoundMeta(id: string): Promise<ISoundMeta | undefined> {
        const ISoundMeta: ISoundMeta | null = await this.soundMetaCollection.findOne({ _id: new ObjectId(id) });
        if (ISoundMeta) {
            this.mapTime([ISoundMeta]);
        }
        return ISoundMeta ?? undefined;
    }

    async getSoundMetaByName(fileName: string): Promise<ISoundMeta | undefined> {
        const ISoundMeta: ISoundMeta | null = await this.soundMetaCollection.findOne({ fileName });
        if (ISoundMeta) {
            this.mapTime([ISoundMeta]);
        }
        return ISoundMeta ?? undefined;
    }

    async getSoundCategories(): Promise<string[]> {
        return (await this.soundMetaCollection.distinct('category')).sort((a, b) => a.localeCompare(b));
    }

    async removeSoundMeta(id: string): Promise<DeleteResult> {
        return this.soundMetaCollection.deleteOne({ _id: new ObjectId(id) });
    }

    async getUsersInfo(users: Snowflake[], serverId: Snowflake): Promise<IUser[]> {
        const usersWithoutInfo: IUser[] = [];
        const userInfos: IUser[] = await this.userCollection.find(
            {
                id:
                    {
                        $in: users
                    },
                [`intros.${serverId}`]: { $exists: true }
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
        return this.log(createLog(meta.serverId, userId, message, { fileName: meta.fileName, id: meta._id }));
    }

    async logPlaySound(userId: Snowflake, meta: ISoundMeta): Promise<InsertOneResult<ILog>> {
        return this.logSound(userId, meta, 'Play Sound');
    }

    private async logSoundUpload(soundMetas: ISoundMeta[]): Promise<InsertManyResult<Document>> {
        const logs = soundMetas.map(meta => createLog(meta.serverId, meta.userId, 'Sound Upload', { fileName: meta.fileName, id: meta._id }));
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
            ...(fromTime && { time: { $gte: fromTime } })
        };

        return await this.logCollection.find(
            findQuery,
            query
        ).toArray();
    }

    async getServerSettings(serverId: Snowflake): Promise<IServerSettings> {
        const result: IServerSettings | null = await this.serverInfoCollection.findOne({ id: serverId },
            {
                projection: {
                    _id: 0
                }
            });
        return result ?? createServerSettings(serverId);
    }

    async updateServerSettings(serverInfo: IServerSettings): Promise<UpdateResult> {
        const { id, ...data } = serverInfo;
        return this.serverInfoCollection.updateOne({ id }, { $set: { ...data } }, { upsert: true });
    }

    public async getUsersRecordVolume(serverId: string): Promise<Omit<IUserVoiceSettings, 'username'>[]> {
        const serverSettings = await this.serverInfoCollection.findOne(
            {
                id: serverId
            },
            {
                projection:
                    {
                        userSettings: 1,
                        id: 1,
                        _id: 0
                    }
            });
        return serverSettings?.userSettings ?? [];
    }

    public async updateUserRecordVolume(serverId: string, userId: string, volume: number): Promise<void> {
        const result = await this.serverInfoCollection.updateOne({
            id: serverId,
            'userSettings.id': userId
        }, {
            $set: {
                'userSettings.$.recordVolume': volume
            }
        });
        if (!result.matchedCount) {
            // update not possible because no user configuration exists. Add it to the database

            await this.serverInfoCollection.updateOne({
                id: serverId,
            }, {
                $addToSet: {
                    userSettings: {
                        id: userId,
                        recordVolume: volume,
                    }
                }
            });
        }
    }

    private mapTime(soundsMeta: { time?: number, _id: ObjectId }[]): void {
        for (const soundMeta of soundsMeta) {
            soundMeta.time = soundMeta._id.getTimestamp().getTime();
        }
    }
}

export const databaseHelper = new DatabaseHelper();