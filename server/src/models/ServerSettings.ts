import { Snowflake } from "discord.js";
import { ObjectID } from "mongodb";

export class ServerSettings {
    public id: Snowflake = '';
    public playIntro: boolean = false;
    public playOutro: boolean = false;
    public minUser: boolean = false;
    public playIntroWhenUnmuted: boolean = false;
    public leaveChannelAfterPlay: boolean = false;
    public defaultIntro?: ObjectID;
    public defaultOutro?: ObjectID;
}