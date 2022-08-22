import { ObjectId } from 'mongodb';
import { UserToken } from '../models/UserToken';

export interface IUser {
    _id: ObjectId;
    id: string;
    intros: Record<string, ObjectId | undefined>;
    token?: UserToken;
}