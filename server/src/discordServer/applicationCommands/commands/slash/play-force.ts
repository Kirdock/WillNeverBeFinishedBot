import {
    getLangSlashCommandBuilder,
    getSoundSelection,
    getVolumeInput,
    playSoundThroughInteraction
} from '../../../utils/commonCommand.utils';
import type { ChatCommand } from '../../../../interfaces/command';
import { PermissionsBitField } from 'discord.js';
import { CommandLangKey } from '../../types/lang.types';
import { getCommandLangKey } from '../../commandLang';

const { soundCommandName, soundOption, autocomplete } = getSoundSelection();
const { volumeCommandName, volumeOption } = getVolumeInput();

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.PLAY_FORCE_NAME, CommandLangKey.PLAY_FORCE_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(soundOption)
        .addIntegerOption(volumeOption)
        .toJSON(),

    async execute(interaction) {
        const result = await playSoundThroughInteraction(interaction, soundCommandName, volumeCommandName, true);
        return result ?? getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
