import { ApplicationCommandType } from 'discord.js';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import type { Command } from '../../../interfaces/command';
import {
    getScopedSlashCommandBuilder,
    getSoundSelection,
    getVolumeInput,
    playSoundThroughInteraction
} from '../../utils/commonCommand.utils';


const { fileCommandName, fileNameOption, autocomplete } = getSoundSelection();
const { volumeCommandName, volumeOption } = getVolumeInput();

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.PLAY_NAME, CommandLangKey.PLAY_DESCRIPTION)
        .addStringOption(fileNameOption)
        .addIntegerOption(volumeOption)
        .toJSON(),

    async execute(interaction) {
        const result = await playSoundThroughInteraction(interaction, fileCommandName, volumeCommandName);
        return result ?? getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
