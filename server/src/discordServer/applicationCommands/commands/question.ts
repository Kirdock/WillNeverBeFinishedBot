import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const answers: CommandLangKey[] = [CommandLangKey.QUESTION_CHOICE_YES, CommandLangKey.QUESTION_CHOICE_NO, CommandLangKey.QUESTION_CHOICE_ASK_AGAIN];

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.QUESTION_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.QUESTION_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.QUESTION_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.QUESTION_DESCRIPTION))
        .addStringOption((option) =>
            option
                .setName(getDefaultCommandLang(CommandLangKey.QUESTION_QUESTION_NAME))
                .setNameLocalizations(getCommandLang(CommandLangKey.QUESTION_QUESTION_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.QUESTION_QUESTION_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.QUESTION_QUESTION_DESCRIPTION))
                .setRequired(true)).toJSON(),
    async execute(interaction) {
        const choice = answers[Math.floor(Math.random() * answers.length)];

        return getCommandLangKey(interaction, choice);
    },
};

export default command;
