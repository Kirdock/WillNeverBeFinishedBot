import {
    getLangComponent,
    getLangSlashCommandBuilder,
    getVolumeInput,
    playYoutubeThroughInteraction
} from '../../../utils/commonCommand.utils.js';
import type { ChatCommand } from '../../../../interfaces/command.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang.js';

const urlOptionName = getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_URL_NAME);
const { volumeCommandName, volumeOption } = getVolumeInput();

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.PLAY_YOUTUBE_NAME, CommandLangKey.PLAY_YOUTUBE_DESCRIPTION)
        .addStringOption((option) =>
            getLangComponent(option, CommandLangKey.POST_STEAM_LINK_URL_NAME, CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION)
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
