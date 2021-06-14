import { Snowflake } from "discord.js";
import { ObjectID } from "mongodb";

export class Log {
    public _id: ObjectID = new ObjectID();
    public time: string = new Date().toISOString();

    constructor(public serverId: Snowflake, public userId: Snowflake, public action: string, public file?: {fileName: string, id: ObjectID}){

    }
}