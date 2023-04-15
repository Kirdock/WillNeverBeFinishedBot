import type { ChatCommand } from '../../../../interfaces/command';
import { getDefaultCommandLang } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import {
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder
} from '../../../utils/commonCommand.utils';
import { DISCORD_MAX_MESSAGE_LENGTH } from '../../../constants';

const popText = '||pop||';
const rowName = getDefaultCommandLang(CommandLangKey.BUBBLE_ROW_NAME);
const columnName = getDefaultCommandLang(CommandLangKey.BUBBLE_COLUMN_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.BUBBLE_NAME, CommandLangKey.BUBBLE_DESCRIPTION)
        .addIntegerOption((option) =>
            getLangComponent(option, CommandLangKey.BUBBLE_ROW_NAME, CommandLangKey.BUBBLE_ROW_DESCRIPTION)
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            getLangComponent(option, CommandLangKey.BUBBLE_COLUMN_NAME, CommandLangKey.BUBBLE_COLUMN_DESCRIPTION)
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const { member } = getInteractionMetadata(interaction);
        const rows = interaction.options.getInteger(rowName, true);
        const columns = interaction.options.getInteger(columnName, true);

        const max = ((popText.length * columns + 1) * rows + member.id.length + 3 + 1) > DISCORD_MAX_MESSAGE_LENGTH ? 15 : 250;
        const normalizedColumns = Math.min(columns, max);
        const normalizedRows = Math.min(rows, max);
        const stringBuilder: string[] = [];

        for (let rowIndex = 0; rowIndex < normalizedRows; ++rowIndex) {
            stringBuilder.push('\n');
            for (let columnIndex = 0; columnIndex < normalizedColumns; ++columnIndex) {
                stringBuilder.push(popText);
            }
        }
        return {
            content: stringBuilder.join(''),
            ephemeral: false,
        };
    },
};

export default command;
