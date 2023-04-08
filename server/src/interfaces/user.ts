import type { ObjectId } from 'mongodb';
import type { IUserToken } from './UserToken';

export interface IUser {
    _id: ObjectId;
    id: string;
    intros: Record<string, ObjectId | undefined>;
    token?: IUserToken;
}