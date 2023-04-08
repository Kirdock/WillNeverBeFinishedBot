import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { getInteractionMetadata } from '../applicationManager';
import { hasPlayLock } from '../../../services/musicPlayer';
import { voiceHelper } from '../../../services/voiceHelper';
import { discordBot } from '../../DiscordBot';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.LEAVE_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.LEAVE_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.LEAVE_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.LEAVE_DESCRIPTION))
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
