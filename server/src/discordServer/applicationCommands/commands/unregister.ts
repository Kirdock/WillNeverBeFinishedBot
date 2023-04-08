import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { unregisterApplicationCommands } from '../applicationManager';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';


const command: Command =  {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.UNREGISTER_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.UNREGISTER_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.UNREGISTER_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.UNREGISTER_DESCRIPTION))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .toJSON(),
    async execute(interaction) {
        if (!interaction.guildId) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_GUILD);
        }

        await interaction.reply({
            content:getCommandLangKey(interaction, CommandLangKey.TRYING_MY_BEST),
            ephemeral: true,
        });
        await unregisterApplicationCommands(interaction.client, interaction.guildId);
    },
};
export default command;