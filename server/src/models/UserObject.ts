import { Snowflake } from "discord.js";

export class UserObject {
    public id!: Snowflake;
    public username!: string;
    public discriminator!: string;
    public avatar!: string;
    public bot!: boolean;
    public system!: boolean;
    public mfa_enabled!: boolean;
    public locale!: string;
    public verified!: boolean;
    public email!: string;
    public flags!: number;
    public premium_type!: number;
    public public_flags!: number;
}