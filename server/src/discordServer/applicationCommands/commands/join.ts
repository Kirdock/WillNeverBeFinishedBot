import { getInteractionMetadata } from '../applicationManager';
import { ApplicationCommandType } from 'discord.js';
import { voiceHelper } from '../../../services/voiceHelper';
import type { Command } from '../../../interfaces/command';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.JOIN_NAME, CommandLangKey.JOIN_DESCRIPTION)
        .toJSON(),
    async execute(interaction): Promise<string> {
        const { member, guild } = await getInteractionMetadata(interaction);
        await voiceHelper.joinVoiceChannelThroughMember(member, guild, interaction.locale);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
