import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getScopedOption, getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import openAI from '../../../services/openAI';
import { getCommandLangKey, getDefaultCommandLang } from '../commandLang';

const textCommand = getDefaultCommandLang(CommandLangKey.CHAT_GPT_TEXT_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    enabled: !!openAI,
    data: getScopedSlashCommandBuilder(CommandLangKey.CHAT_GPT_NAME, CommandLangKey.CHAT_GPT_DESCRIPTION)
        .addStringOption((option) =>
            getScopedOption(option, CommandLangKey.CHAT_GPT_TEXT_NAME, CommandLangKey.CHAT_GPT_TEXT_DESCRIPTION)
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        if (!openAI) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_OPEN_AI_DISABLED);
        }
        const text = interaction.options.getString(textCommand, true);
        const messagePromise = interaction.reply(getCommandLangKey(interaction, CommandLangKey.LOADING));
        const response = await openAI.getResponse(text);
        const message = await messagePromise;

        await message.edit(response ?? getCommandLangKey(interaction, CommandLangKey.ERRORS_EMPTY_RESPONSE));
    }
};

export default command;
