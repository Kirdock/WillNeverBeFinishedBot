import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';
import { discordBot } from '../../DiscordBot';

const command: Command = {
    data: new SlashCommandBuilder().setName('list').setDescription('Prints URL to the website of the bot').toJSON(),
    async execute() {
        return discordBot.hostUrl;
    }
}

export default command;
