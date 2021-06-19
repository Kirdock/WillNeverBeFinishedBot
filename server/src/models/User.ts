import { ObjectID } from "bson";
import { UserToken } from "./UserToken";

export class User {
    public _id!: ObjectID;
    public id?: string;
    public intros: {[key: string]: string} = {};
    public token?: UserToken;
}