import type { ChatCommand } from '../../../../interfaces/command';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getLangSlashCommandBuilder, takeRandom } from '../../../utils/commonCommand.utils';

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
