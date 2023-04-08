import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder().setName('ping').setDescription('pong?').toJSON(),
    async execute() {
        return 'pong';
    }
}

export default command;