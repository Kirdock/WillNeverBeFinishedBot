import type { Snowflake } from 'discord.js';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';

export interface IUserServerInformation {
    id: Snowflake;
    name: string;
    icon: string | null;
    isAdmin: boolean;
    settings?: IServerSettings;
}
