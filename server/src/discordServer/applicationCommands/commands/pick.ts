import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName('pick')
        .setDescription('Picks a random choice')
        .addStringOption((option) =>
            option
                .setName('choices')
                .setDescription('Choices separated by ","')
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const choices = interaction.options.getString('choices', true);

        const elements = choices.split(',').map((item) => item.trim()).filter((item) => item.length !== 0);
        if (elements.length === 0) {
            return 'Choices can\'t be empty!';
        }
        const index = Math.floor(Math.random() * elements.length);
        return elements[index];
    }
}

export default command;
