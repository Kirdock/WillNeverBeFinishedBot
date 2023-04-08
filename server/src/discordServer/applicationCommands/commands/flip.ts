import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';

const command: Command = {
    data: new SlashCommandBuilder().setName('flip').setDescription('Flip a coin').toJSON(),
    async execute() {
        return {
            content: Math.floor(Math.random() * 2) == 0 ? 'Kopf' : 'Zahl',
            ephemeral: false,
        };
    }
}

export default command;