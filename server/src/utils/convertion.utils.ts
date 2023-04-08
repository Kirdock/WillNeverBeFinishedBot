import type { UserVolumesDict } from '@kirdock/discordjs-voice-recorder';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';

export function asNumberOrUndefined(value: string): number | undefined {
    if (value === '') {
        return undefined;
    }
    const parsed = +value;
    if (isNaN(parsed)) {
        return undefined;
    }
    return parsed;
}

export function mapUserSettingsToDict(serverSettings: IServerSettings): UserVolumesDict {
    return serverSettings.userSettings.reduce<UserVolumesDict>((dict, user)=> {
        dict[user.id] = user.recordVolume;
        return dict;
    }, {});
}