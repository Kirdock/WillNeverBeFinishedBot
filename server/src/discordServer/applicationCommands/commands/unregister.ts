import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { unregisterApplicationCommands } from '../applicationManager';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';


const command: Command =  {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.UNREGISTER_NAME, CommandLangKey.UNREGISTER_DESCRIPTION)
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
