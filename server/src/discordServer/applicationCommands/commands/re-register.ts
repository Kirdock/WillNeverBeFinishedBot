import { registerApplicationCommands, unregisterApplicationCommands } from '../applicationManager';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import type { Command } from '../../../interfaces/command';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getInteractionMetadata, getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';

const command: Command =  {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.RE_REGISTER_NAME, CommandLangKey.RE_REGISTER_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .toJSON(),
    async execute(interaction) {
        const { guildId, member } = getInteractionMetadata(interaction);

        await interaction.reply({
            content:getCommandLangKey(interaction, CommandLangKey.TRYING_MY_BEST),
            ephemeral: true,
        });
        const statusMessage = await member.send(getCommandLangKey(interaction, CommandLangKey.LOADING));
        await unregisterApplicationCommands(interaction.client, guildId, statusMessage);
        await registerApplicationCommands(interaction.client, guildId, statusMessage);
        // answering not possible because initial interaction gets deleted

        await statusMessage.edit(getCommandLangKey(interaction, CommandLangKey.SUCCESS));
    },
};

export default command;
