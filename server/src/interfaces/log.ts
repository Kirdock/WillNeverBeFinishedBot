import { ObjectId } from 'mongodb';
import { Snowflake } from 'discord.js';

export interface ILog {
    _id: ObjectId;
    time: number;
    serverId: Snowflake;
    userId: Snowflake;
    action: string;
    file?: {
        fileName: string;
        id: ObjectId
    };
}