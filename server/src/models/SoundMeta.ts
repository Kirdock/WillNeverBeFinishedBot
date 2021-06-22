import { ObjectID } from "bson";
import { Snowflake } from "discord.js";

export class SoundMeta {
    public _id: ObjectID;
    public userName?: string;
    public time?: number;

    constructor(public path: string, public fileName: string, public category: string, public userId: Snowflake, public serverId: Snowflake) {
        // consider if only id or id and username should be saved
        this._id = new ObjectID();
    }

    public static mapTime(soundsMeta: SoundMeta[]): void {
        for(const soundMeta of soundsMeta) {
            soundMeta.time = soundMeta._id.getTimestamp().getTime();
        }
    }
}