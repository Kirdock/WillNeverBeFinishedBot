import { Snowflake } from "discord.js";

export class ServerSettings {
    public id: Snowflake = '';
    public playIntro: boolean = false;
    public playOutro: boolean = false;
    public minUser: boolean = false;
    public playIntroWhenUnmuted: boolean = false;
    public leaveChannelAfterPlay: boolean = false;
    public defaultIntro?: string;
    public defaultOutro?: string;

    constructor(serverId: Snowflake) {
        this.id = serverId;
    }
}