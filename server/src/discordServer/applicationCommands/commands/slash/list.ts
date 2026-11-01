import type { ChatCommand } from '../../../../interfaces/command.js';
import { discordBot } from '../../../DiscordBot.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils.js';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.LIST_NAME, CommandLangKey.LIST_DESCRIPTION)
        .toJSON(),
    async execute() {
        return discordBot.hostUrl;
    },
};

export default command;
