import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { discordBot } from '../../DiscordBot';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder().setName('list').setDescription('Prints URL to the website of the bot').toJSON(),
    async execute() {
        return discordBot.hostUrl;
    },
};

export default command;
