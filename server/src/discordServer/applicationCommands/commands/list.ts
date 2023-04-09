import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { discordBot } from '../../DiscordBot';
import { CommandLangKey } from '../types/lang.types';
import { getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.LIST_NAME, CommandLangKey.LIST_DESCRIPTION)
        .toJSON(),
    async execute() {
        return discordBot.hostUrl;
    },
};

export default command;
