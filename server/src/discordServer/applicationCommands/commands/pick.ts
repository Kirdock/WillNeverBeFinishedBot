import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const choicesName = getDefaultCommandLang(CommandLangKey.PICK_CHOICE_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.PICK_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.PICK_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.PICK_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.PICK_DESCRIPTION))
        .addStringOption((option) =>
            option
                .setName(choicesName)
                .setNameLocalizations(getCommandLang(CommandLangKey.PICK_CHOICE_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.PICK_CHOICE_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.PICK_CHOICE_DESCRIPTION))
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const choices = interaction.options.getString(choicesName, true);

        const elements = choices.split(',').map((item) => item.trim()).filter((item) => item.length !== 0);
        if (elements.length === 0) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_DATA);
        }
        const index = Math.floor(Math.random() * elements.length);
        return elements[index];
    },
};

export default command;
