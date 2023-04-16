import type { ChatCommand } from '../../../../interfaces/command';
import { getLangComponent, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import openAI from '../../../../services/openAI';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import { DISCORD_MAX_MESSAGE_LENGTH } from '../../../constants';

const textCommand = getDefaultCommandLang(CommandLangKey.CHAT_GPT_TEXT_NAME);

const command: ChatCommand = {
    enabled: !!openAI,
    data: getLangSlashCommandBuilder(CommandLangKey.CHAT_GPT_NAME, CommandLangKey.CHAT_GPT_DESCRIPTION)
        .addStringOption((option) =>
            getLangComponent(option, CommandLangKey.CHAT_GPT_TEXT_NAME, CommandLangKey.CHAT_GPT_TEXT_DESCRIPTION)
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        if (!openAI) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_OPEN_AI_DISABLED);
        }
        const text = interaction.options.getString(textCommand, true);
        await interaction.deferReply();
        const response = await openAI.getResponse(text);

        await interaction.editReply(response?.substring(0, DISCORD_MAX_MESSAGE_LENGTH) ?? getCommandLangKey(interaction, CommandLangKey.ERRORS_EMPTY_RESPONSE));
    }
};

export default command;
