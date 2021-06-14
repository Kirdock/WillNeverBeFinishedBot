import { ObjectID } from "bson";
import { Snowflake } from "discord.js";

export class SoundMeta {
    public time: string;
    public _id: ObjectID;
    public userName?: string;

    constructor(public path: string, public fileName: string, public category: string, public userId: Snowflake, public serverId: Snowflake) {
        // consider if only id or id and username should be saved
        this.time = new Date().toISOString();
        this._id = new ObjectID();
    }
}