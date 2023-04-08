import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.FLIP_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.FLIP_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.FLIP_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.FLIP_DESCRIPTION))
        .toJSON(),
    async execute(interaction) {
        return {
            content: getCommandLangKey(interaction, Math.floor(Math.random() * 2) == 0 ? CommandLangKey.FLIP_CHOICE_HEAD : CommandLangKey.FLIP_CHOICE_TAILS),
            ephemeral: false,
        };
    },
};

export default command;