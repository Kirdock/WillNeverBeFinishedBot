import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { unregisterApplicationCommands } from '../applicationManager';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getInteractionMetadata, getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';


const command: Command =  {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.UNREGISTER_NAME, CommandLangKey.UNREGISTER_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);

        await interaction.reply({
            content:getCommandLangKey(interaction, CommandLangKey.TRYING_MY_BEST),
            ephemeral: true,
        });
        const statusMessage = await member.send(getCommandLangKey(interaction, CommandLangKey.LOADING));
        await unregisterApplicationCommands(interaction.client, guildId, statusMessage);

        await statusMessage.edit(getCommandLangKey(interaction, CommandLangKey.SUCCESS));
    },
};
export default command;
