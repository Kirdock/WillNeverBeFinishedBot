import { VoiceRecorder } from '@kirdock/discordjs-voice-recorder';
import { asNumberOrUndefined } from '../utils/convertion.utils';
import { EnvironmentConfig } from './config';
import { discordBot } from '../discordServer/DiscordBot';

export const recordHelper = new VoiceRecorder({
    maxRecordTimeMs: asNumberOrUndefined(EnvironmentConfig.MAX_RECORD_TIME_MINUTES),
}, discordBot.client);
