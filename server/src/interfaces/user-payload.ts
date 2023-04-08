import type { Snowflake } from 'discord.js';

export interface IUserPayload {
    _id: string;
    id: Snowflake;
    username: string;
    isSuperAdmin: boolean;
}
