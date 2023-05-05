import type { ChatCommand, InteractionExecuteResponse } from '../../../../interfaces/command';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import {
    getCommandSelection,
    getCommandSelectionAutocompleteAvailable,
    getCommandSelectionAutocompleteRegistered,
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { deleteApplicationCommand, registerApplicationCommand } from '../../applicationManager';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';

const { commandSelectionName, commandOption } = getCommandSelection(true);
const registerCommandName = getDefaultCommandLang(CommandLangKey.COMMAND_REGISTER_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.COMMAND_NAME, CommandLangKey.COMMAND_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand((option) =>
            getLangComponent(option, CommandLangKey.COMMAND_REGISTER_NAME, CommandLangKey.COMMAND_REGISTER_DESCRIPTION)
                .addStringOption(commandOption)
        ).addSubcommand((option) =>
            getLangComponent(option, CommandLangKey.COMMAND_REMOVE_NAME, CommandLangKey.COMMAND_REMOVE_DESCRIPTION)
                .addStringOption(commandOption)
        ).toJSON(),
    async execute(interaction) {
        const subCommandName = interaction.options.getSubcommand(true);

        if (subCommandName === registerCommandName) {
            return registerCommand(interaction);
        }
        return deleteCommand(interaction);
    },
    async autocomplete(interaction: AutocompleteInteraction) {
        const subCommandName = interaction.options.getSubcommand(true);

        if (subCommandName === registerCommandName) {
            return getCommandSelectionAutocompleteRegistered(interaction);
        }
        return getCommandSelectionAutocompleteAvailable(interaction);
    }
};

async function registerCommand(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const command = interaction.options.getString(commandSelectionName, true);

    await registerApplicationCommand(interaction, guildId, command);

    return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
}

async function deleteCommand(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const command = interaction.options.getString(commandSelectionName, true);

    await deleteApplicationCommand(interaction, guildId, command);

    return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
}

export default command;
