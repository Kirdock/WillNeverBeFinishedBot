import { Snowflake } from "discord.js";

export class UserPayload {
    constructor(public id: Snowflake, public username: string, public isSuperAdmin = false){}
}