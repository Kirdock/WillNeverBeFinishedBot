import { VoiceRecorder } from '@kirdock/discordjs-voice-recorder';
import { asNumberOrUndefined } from '../utils/convertion.utils.js';
import { EnvironmentConfig } from './config.js';
import { discordBot } from '../discordServer/DiscordBot.js';

export const recordHelper = new VoiceRecorder({
    maxRecordTimeMinutes: asNumberOrUndefined(EnvironmentConfig.MAX_RECORD_TIME_MINUTES),
}, discordBot.client);
