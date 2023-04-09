// ffmpeg loudnorm?
// musicPlayer: play stream?

import {
    getScopedOption,
    getScopedSlashCommandBuilder,
    getVolumeInput,
    playYoutubeThroughInteraction
} from '../../utils/commonCommand.utils';
import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { CommandLangKey } from '../types/lang.types';
import { getCommandLangKey, getDefaultCommandLang } from '../commandLang';

const urlOptionName = getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_URL_NAME);
const { volumeCommandName, volumeOption } = getVolumeInput();

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.PLAY_YOUTUBE_NAME, CommandLangKey.PLAY_YOUTUBE_DESCRIPTION)
        .addStringOption((option) =>
            getScopedOption(option, CommandLangKey.POST_STEAM_LINK_URL_NAME, CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION)
                .setRequired(true)
        )
        .addIntegerOption(volumeOption)
        .toJSON(),

    async execute(interaction) {
        const result = await playYoutubeThroughInteraction(interaction, urlOptionName, volumeCommandName);
        return result ?? getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    }
};

export default command;
