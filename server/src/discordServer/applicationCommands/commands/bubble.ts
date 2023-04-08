import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { getInteractionMetadata } from '../applicationManager';
import { getCommandLang, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const rowName = getDefaultCommandLang(CommandLangKey.BUBBLE_ROW_NAME);
const columnName = getDefaultCommandLang(CommandLangKey.BUBBLE_COLUMN_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.BUBBLE_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.BUBBLE_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.BUBBLE_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.BUBBLE_DESCRIPTION))
        .addIntegerOption((option) =>
            option
                .setName(rowName)
                .setNameLocalizations(getCommandLang(CommandLangKey.BUBBLE_ROW_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.BUBBLE_ROW_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.BUBBLE_ROW_DESCRIPTION))
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName(columnName)
                .setDescription(getDefaultCommandLang(CommandLangKey.BUBBLE_COLUMN_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.BUBBLE_COLUMN_DESCRIPTION))
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const { member } = await getInteractionMetadata(interaction);
        const rows = interaction.options.getInteger(rowName, true);
        const columns = interaction.options.getInteger(columnName, true);

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
        };
    },
};

export default command;
