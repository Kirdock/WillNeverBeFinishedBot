import { User } from "discord.js";
import { UserObject } from "./UserObject";

export class UserPayload extends UserObject{
    public isSuperAdmin: boolean = false;
}