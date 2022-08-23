import { IUserPayload } from '../interfaces/user-payload';
import { Snowflake } from 'discord.js';


export function createUserPayload(_id: string, id: Snowflake, username: string, isSuperAdmin = false): IUserPayload {
    return {
        _id,
        id,
        username,
        isSuperAdmin
    };
}
