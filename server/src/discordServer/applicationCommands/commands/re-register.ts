import { registerApplicationCommands, unregisterApplicationCommands } from '../applicationManager';
import { ApplicationCommandType, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../interfaces/command';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command =  {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.RE_REGISTER_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.RE_REGISTER_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.RE_REGISTER_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.RE_REGISTER_DESCRIPTION))
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
        await registerApplicationCommands(interaction.client, interaction.guildId);
        // answering not possible because initial interaction gets deleted
    },
};

export default command;
