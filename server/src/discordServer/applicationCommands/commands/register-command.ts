import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import {
    getCommandSelection,
    getInteractionMetadata,
    getScopedSlashCommandBuilder
} from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import { registerApplicationCommand } from '../applicationManager';
import { getCommandLangKey } from '../commandLang';

const { commandSelectionName, commandOption, autocomplete } = getCommandSelection(false, true);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.REGISTER_COMMAND_NAME, CommandLangKey.REGISTER_COMMAND_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(commandOption)
        .toJSON(),
    async execute(interaction) {
        const { guildId } = getInteractionMetadata(interaction);
        const command = interaction.options.getString(commandSelectionName, true);

        await registerApplicationCommand(interaction, guildId, command);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
