import { getInteractionMetadata } from '../applicationManager';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { voiceHelper } from '../../../services/voiceHelper';
import type { Command } from '../../../interfaces/command';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.JOIN_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.JOIN_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.JOIN_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.JOIN_DESCRIPTION))
        .toJSON(),
    async execute(interaction): Promise<string> {
        const { member, guild } = await getInteractionMetadata(interaction);
        await voiceHelper.joinVoiceChannelThroughMember(member, guild, interaction.locale);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
