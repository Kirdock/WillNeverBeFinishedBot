import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedOption, getScopedSlashCommandBuilder, takeRandom } from '../../utils/commonCommand.utils';

const answers: CommandLangKey[] = [CommandLangKey.QUESTION_CHOICE_YES, CommandLangKey.QUESTION_CHOICE_NO, CommandLangKey.QUESTION_CHOICE_ASK_AGAIN];

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.QUESTION_NAME, CommandLangKey.QUESTION_DESCRIPTION)
        .addStringOption((option) =>
            getScopedOption(option, CommandLangKey.QUESTION_QUESTION_NAME, CommandLangKey.QUESTION_QUESTION_DESCRIPTION)
                .setRequired(true)).toJSON(),
    async execute(interaction) {
        return getCommandLangKey(interaction, takeRandom(answers));
    },
};

export default command;
