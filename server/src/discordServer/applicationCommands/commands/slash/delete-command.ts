import type { ChatCommand } from '../../../../interfaces/command';
import { PermissionsBitField } from 'discord.js';
import {
    getCommandSelection,
    getInteractionMetadata,
    getLangSlashCommandBuilder
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { deleteApplicationCommand } from '../../applicationManager';
import { getCommandLangKey } from '../../commandLang';

const { commandSelectionName, commandOption, autocomplete } = getCommandSelection(true, true);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.DELETE_COMMAND_NAME, CommandLangKey.DELETE_COMMAND_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(commandOption)
        .toJSON(),
    async execute(interaction) {
        const { guildId } = getInteractionMetadata(interaction);
        const command = interaction.options.getString(commandSelectionName, true);

        await deleteApplicationCommand(interaction, guildId, command);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
