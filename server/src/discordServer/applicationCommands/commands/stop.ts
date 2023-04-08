import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { stopPlaying } from '../../../services/musicPlayer';
import { getInteractionMetadata } from '../applicationManager';
import { discordBot } from '../../DiscordBot';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.STOP_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.STOP_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.STOP_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.STOP_DESCRIPTION))
        .toJSON(),
    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);

        await stopPlaying(guild.id, discordBot.isSuperAdmin(member.id));

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;