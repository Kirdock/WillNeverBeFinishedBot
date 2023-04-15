import type { ChatCommand } from '../../../../interfaces/command';
import { discordBot } from '../../../DiscordBot';
import { CommandLangKey } from '../../types/lang.types';
import { getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.LIST_NAME, CommandLangKey.LIST_DESCRIPTION)
        .toJSON(),
    async execute() {
        return discordBot.hostUrl;
    },
};

export default command;
