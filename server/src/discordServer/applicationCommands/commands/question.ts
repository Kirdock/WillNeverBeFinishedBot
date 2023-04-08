import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';

const answers: string[] = ['Na', 'Jo', 'Frag doch einfach nochmal'];

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('question')
        .setDescription('Ask the something and get a response')
        .addStringOption((option) =>
            option
                .setName('question')
                .setDescription('Enter your question')
                .setRequired(true)).toJSON(),
    async execute() {
        return answers[Math.floor(Math.random() * answers.length)];
    }
}

export default command;