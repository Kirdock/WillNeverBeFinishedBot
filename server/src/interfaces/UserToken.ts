import { ObjectId } from 'mongodb';

export interface IUserToken {
    _id: ObjectId;
    userId: string;
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    time: number;
}