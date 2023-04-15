import type { ChatCommand } from '../../../../interfaces/command';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getLangComponent, getLangSlashCommandBuilder, takeRandom } from '../../../utils/commonCommand.utils';

const choicesName = getDefaultCommandLang(CommandLangKey.PICK_CHOICE_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.PICK_NAME, CommandLangKey.PICK_DESCRIPTION)
        .addStringOption((option) =>
            getLangComponent(option, CommandLangKey.PICK_CHOICE_NAME, CommandLangKey.PICK_CHOICE_DESCRIPTION)
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const choices = interaction.options.getString(choicesName, true);

        const elements = choices.split(',').map((item) => item.trim()).filter((item) => item.length !== 0);
        if (elements.length === 0) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_DATA);
        }

        return takeRandom(elements);
    },
};

export default command;
