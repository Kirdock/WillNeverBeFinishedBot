import { Snowflake } from 'discord.js';
import { ObjectId } from 'mongodb';

export interface ISoundMeta {
    _id: ObjectId;
    path: string,
    fileName: string,
    category: string,
    userId: Snowflake,
    serverId: Snowflake,
    userName?: string;
    time?: number;
}
