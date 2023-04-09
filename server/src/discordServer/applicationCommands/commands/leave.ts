import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getInteractionMetadata } from '../applicationManager';
import { hasPlayLock } from '../../../services/musicPlayer';
import { voiceHelper } from '../../../services/voiceHelper';
import { discordBot } from '../../DiscordBot';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.LEAVE_NAME, CommandLangKey.LEAVE_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);

        if (!hasPlayLock(guild.id) || await discordBot.isUserAdminInServer(member.id, guild.id)) {
            voiceHelper.disconnectVoice(guild.id);
            return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
        }
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS);
    },
};

export default command;
