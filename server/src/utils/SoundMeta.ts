import { Snowflake } from 'discord.js';
import { ObjectId } from 'mongodb';
import { ISoundMeta } from '../interfaces/sound-meta';

export function createSoundMeta(path: string, fileName: string, category: string, userId: Snowflake, serverId: Snowflake): ISoundMeta {
    return {
        _id: new ObjectId(),
        path,
        fileName,
        userId,
        serverId,
        category
    }
}