import type { ChatCommand } from '../../../../interfaces/command.js';
import { getCommandLangKey } from '../../commandLang.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getLangSlashCommandBuilder, takeRandom } from '../../../utils/commonCommand.utils.js';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.FLIP_NAME, CommandLangKey.FLIP_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        return {
            content: getCommandLangKey(interaction, takeRandom([CommandLangKey.FLIP_CHOICE_HEAD, CommandLangKey.FLIP_CHOICE_TAILS])),
        };
    },
};

export default command;
