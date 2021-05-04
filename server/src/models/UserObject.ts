import { Snowflake } from "discord.js";

export class UserObject {
    public id: Snowflake = '';
    public username: string = '';
    public discriminator: string = '';
    public avatar: string = '';
    public bot: boolean = false;
    public system: boolean = false;
    public mfa_enabled: boolean = false;
    public locale: string = '';
    public verified: boolean = false;
    public email: string = '';
    public flags: number = 0;
    public premium_type: number = 0;
    public public_flags: number = 0;

}