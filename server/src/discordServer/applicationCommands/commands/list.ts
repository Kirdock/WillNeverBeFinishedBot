import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { discordBot } from '../../DiscordBot';
import { getCommandLang, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.LIST_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.LIST_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.LIST_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.LIST_DESCRIPTION))
        .toJSON(),
    async execute() {
        return discordBot.hostUrl;
    },
};

export default command;
