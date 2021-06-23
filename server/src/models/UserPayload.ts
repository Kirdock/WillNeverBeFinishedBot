import { Snowflake } from 'discord.js';

export class UserPayload {
    constructor(public _id: string, public id: Snowflake, public username: string, public isSuperAdmin = false){}
}