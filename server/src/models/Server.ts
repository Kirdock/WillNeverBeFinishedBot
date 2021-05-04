import { Snowflake } from "discord.js";

export class Server {
    public id: Snowflake = '';
    public playIntro: boolean = false;
    public playOutro: boolean = false;
    public minUser: boolean = false;
    public playIntroWhenUnmuted: boolean = false;
    public leaveChannelAfterPlay: boolean = false;
    public defaultIntro: number = 0; //id
    public defaultOutro: number = 0; //id

    constructor(){}

}