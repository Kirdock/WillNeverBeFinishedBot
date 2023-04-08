import { ObjectId } from 'mongodb';
import type { IUser } from '../interfaces/user';
import type { IUserVoiceSettings } from '../../../shared/interfaces/user-voice-settings';
import type { IServerUserSettings } from '../../../shared/interfaces/server-settings';

type IUserVoiceSettingsWithoutUsername = Omit<IUserVoiceSettings, 'username'>;

export function createUser(id: string): IUser {
    return {
        _id: new ObjectId(),
        id,
        intros: {},
    };
}

export function createUserVoiceSetting(id: string): IUserVoiceSettingsWithoutUsername {
    return {
        id,
        recordVolume: 100,
    };
}

export function getOrCreateUserVoiceSetting(userSettings: IServerUserSettings[], userId: string): IUserVoiceSettingsWithoutUsername {
    return userSettings.find((userSetting) => userSetting.id === userId) ?? createUserVoiceSetting(userId);
}