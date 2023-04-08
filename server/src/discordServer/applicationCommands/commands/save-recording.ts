import { recordHelper } from '../../../services/recordHelper';
import type { Command } from '../../../interfaces/command';
import type { APIApplicationCommandOptionChoice } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import type { AudioExportType } from '@kirdock/discordjs-voice-recorder';
import { databaseHelper } from '../../../services/databaseHelper';
import { mapUserSettingsToDict } from '../../../utils/convertion.utils';
import { getInteractionMetadata } from '../applicationManager';

type Choices = APIApplicationCommandOptionChoice & {value: AudioExportType};
const choices: Choices[] = [
    { name: 'single', value: 'single' },
    { name: 'separate', value: 'separate' }
];

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Save the last x (up to 10) minutes')
        .addIntegerOption(option =>
            option
                .setName('minutes')
                .setDescription('How many minutes should be saved')
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addStringOption((option) =>
            option.setName('type').setDescription('save as single file or as zip file with a file per user').setChoices(...choices)
        )
        .toJSON(),
    async execute (interaction) {
        const { guild } = await getInteractionMetadata(interaction);
        const minutes = interaction.options.getInteger('minutes') ?? undefined;
        const exportType = (interaction.options.getString('export type') as AudioExportType | null) ?? undefined;
        const serverSettings = await databaseHelper.getServerSettings(guild.id);
        const readable = await recordHelper.getRecordedVoiceAsReadable(guild.id, exportType, minutes, mapUserSettingsToDict(serverSettings));
        const date = new Date().toISOString();
        let fileType: string, fileName: string;

        if (exportType === 'single') {
            fileType = 'audio/mp3';
            fileName = `${date}.mp3`;

        } else {
            fileType = 'application/zip';
            fileName = `${date}-all-streams.zip`;
        }

        return {
            files: [ {
                attachment: readable,
                contentType: fileType,
                name: fileName,
            } ],
            ephemeral: false
        };
    },
};

export default command;