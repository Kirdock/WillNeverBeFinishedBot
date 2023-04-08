import type { Snowflake } from 'discord.js';
import { ObjectId } from 'mongodb';
import type { ILog } from '../interfaces/log';

export function createLog(serverId: Snowflake, userId: Snowflake, action: string, file?: { fileName: string, id: ObjectId }): ILog {
    return {
        _id: new ObjectId(),
        time: new Date().getTime(),
        serverId,
        userId,
        action,
        file,
    };
}
