import type { ChatCommand } from '../../../../interfaces/command';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getLangComponent, getLangSlashCommandBuilder, takeRandom } from '../../../utils/commonCommand.utils';

const answers: CommandLangKey[] = [CommandLangKey.QUESTION_CHOICE_YES, CommandLangKey.QUESTION_CHOICE_NO, CommandLangKey.QUESTION_CHOICE_ASK_AGAIN];

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.QUESTION_NAME, CommandLangKey.QUESTION_DESCRIPTION)
        .addStringOption((option) =>
            getLangComponent(option, CommandLangKey.QUESTION_QUESTION_NAME, CommandLangKey.QUESTION_QUESTION_DESCRIPTION)
                .setRequired(true)).toJSON(),
    async execute(interaction) {
        return getCommandLangKey(interaction, takeRandom(answers));
    },
};

export default command;
