import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';
import { getInteractionMetadata } from '../applicationManager';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('bubble')
        .setDescription('Generate a bubble wrap')
        .addIntegerOption(option =>
            option
                .setName('rows')
                .setDescription('How many rows your bubble wrap should have')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('columns')
                .setDescription('How many columns your bubble wrap should have')
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const { member } = await getInteractionMetadata(interaction);
        const rows = interaction.options.getInteger('rows', true);
        const columns = interaction.options.getInteger('columns', true);

        const text = '||pop||';
        const max = ((text.length * columns + 1) * rows + member.id.length + 3 + 1) > 2000 ? 15 : 250;
        const normalizedColumns = Math.min(columns, max);
        const normalizedRows = Math.min(rows, max);
        const stringBuilder: string[] = [];

        for (let rowIndex = 0; rowIndex < normalizedRows; ++rowIndex) {
            stringBuilder.push('\n');
            for (let columnIndex = 0; columnIndex < normalizedColumns; ++columnIndex) {
                stringBuilder.push(text);
            }
        }
        return {
            content: stringBuilder.join(''),
            ephemeral: false,
        }
    }
}

export default command;
