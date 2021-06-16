import { Snowflake } from "discord.js";

export class UserServerInformation {

    constructor(public id: Snowflake, public name: string, public icon: string | null, public isAdmin: boolean, public permissions: number) { }
}