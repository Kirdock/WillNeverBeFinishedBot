import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedSlashCommandBuilder, takeRandom } from '../../utils/commonCommand.utils';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.FLIP_NAME, CommandLangKey.FLIP_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        return {
            content: getCommandLangKey(interaction, takeRandom([CommandLangKey.FLIP_CHOICE_HEAD, CommandLangKey.FLIP_CHOICE_TAILS])),
            ephemeral: false,
        };
    },
};

export default command;
