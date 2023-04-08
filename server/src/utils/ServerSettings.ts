import type { Snowflake } from 'discord.js';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';

export function createServerSettings(serverId: Snowflake): IServerSettings {
    return {
        id: serverId,
        playIntro: false,
        playOutro: false,
        minUser: false,
        playIntroWhenUnmuted: false,
        leaveChannelAfterPlay: false,
        userSettings: [],
        recordVoice: false,
    };
}