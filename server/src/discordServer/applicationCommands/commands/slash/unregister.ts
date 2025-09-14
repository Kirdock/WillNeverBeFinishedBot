import type { ChatCommand } from '../../../../interfaces/command';
import { MessageFlags, PermissionsBitField } from 'discord.js';
import { unregisterApplicationCommands } from '../../applicationManager';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';


const command: ChatCommand =  {
    data: getLangSlashCommandBuilder(CommandLangKey.UNREGISTER_NAME, CommandLangKey.UNREGISTER_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);

        await interaction.reply({
            content:getCommandLangKey(interaction, CommandLangKey.TRYING_MY_BEST),
            flags: MessageFlags.Ephemeral,
        });
        const statusMessage = await member.send(getCommandLangKey(interaction, CommandLangKey.LOADING));
        await unregisterApplicationCommands(interaction.client, guildId, statusMessage);

        await statusMessage.edit(getCommandLangKey(interaction, CommandLangKey.SUCCESS));
    },
};
export default command;
