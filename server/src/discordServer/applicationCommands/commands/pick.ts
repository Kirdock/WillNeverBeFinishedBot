import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedOption, getScopedSlashCommandBuilder, takeRandom } from '../../utils/commonCommand.utils';

const choicesName = getDefaultCommandLang(CommandLangKey.PICK_CHOICE_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.PICK_NAME, CommandLangKey.PICK_DESCRIPTION)
        .addStringOption((option) =>
            getScopedOption(option, CommandLangKey.PICK_CHOICE_NAME, CommandLangKey.PICK_CHOICE_DESCRIPTION)
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
