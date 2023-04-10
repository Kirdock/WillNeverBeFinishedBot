import {
    getScopedSlashCommandBuilder,
    getSoundSelection,
    getVolumeInput,
    playSoundThroughInteraction
} from '../../utils/commonCommand.utils';
import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { CommandLangKey } from '../types/lang.types';
import { getCommandLangKey } from '../commandLang';

const { fileCommandName, fileNameOption, autocomplete } = getSoundSelection();
const { volumeCommandName, volumeOption } = getVolumeInput();

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.PLAY_FORCE_NAME, CommandLangKey.PLAY_FORCE_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(fileNameOption)
        .addIntegerOption(volumeOption)
        .toJSON(),

    async execute(interaction) {
        const result = await playSoundThroughInteraction(interaction, fileCommandName, volumeCommandName, true);
        return result ?? getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
