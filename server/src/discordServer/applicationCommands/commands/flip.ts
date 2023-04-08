import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder().setName('flip').setDescription('Flip a coin').toJSON(),
    async execute() {
        return {
            content: Math.floor(Math.random() * 2) == 0 ? 'Kopf' : 'Zahl',
            ephemeral: false,
        };
    }
};

export default command;