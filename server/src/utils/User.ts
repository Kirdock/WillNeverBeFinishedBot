import { ObjectId } from 'mongodb';
import { IUser } from '../interfaces/user';

export function createUser(id: string): IUser {
    return {
        _id: new ObjectId(),
        id,
        intros: {},
    }
}
