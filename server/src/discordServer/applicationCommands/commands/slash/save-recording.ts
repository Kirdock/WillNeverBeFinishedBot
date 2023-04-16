import { recordHelper } from '../../../../services/recordHelper';
import type { ChatCommand } from '../../../../interfaces/command';
import type { APIApplicationCommandOptionChoice } from 'discord.js';
import type { AudioExportType } from '@kirdock/discordjs-voice-recorder';
import { databaseHelper } from '../../../../services/databaseHelper';
import { mapUserSettingsToDict } from '../../../../utils/convertion.utils';
import { getCommandLang, getDefaultCommandLang } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import {
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder
} from '../../../utils/commonCommand.utils';
import { AUDIO_CONTENT_TYPE } from '../../../constants';

type Choices = APIApplicationCommandOptionChoice & {value: AudioExportType};
const choices: Choices[] = [
    {
        name: getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_SINGLE),
        value: 'single',
        name_localizations: getCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_SINGLE)
    },
    {
        name: getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_MULTIPLE),
        value: 'separate',
        name_localizations: getCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_MULTIPLE)
    }
];

const minutesName = getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_MINUTES_NAME);
const typeName = getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.SAVE_RECORDING_NAME, CommandLangKey.SAVE_RECORDING_DESCRIPTION)
        .addIntegerOption((option) =>
            getLangComponent(option, CommandLangKey.SAVE_RECORDING_MINUTES_NAME, CommandLangKey.SAVE_RECORDING_MINUTES_DESCRIPTION)
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addStringOption((option) =>
            getLangComponent(option, CommandLangKey.SAVE_RECORDING_TYPE_NAME, CommandLangKey.SAVE_RECORDING_TYPE_DESCRIPTION)
                .setChoices(...choices)
        )
        .toJSON(),
    async execute (interaction) {
        const { guildId } = getInteractionMetadata(interaction);
        await interaction.deferReply();
        const minutes = interaction.options.getInteger(minutesName) ?? undefined;
        const exportType = (interaction.options.getString(typeName) as AudioExportType | null) ?? 'single';
        const serverSettings = await databaseHelper.getServerSettings(guildId);
        const date = new Date().toISOString();
        let fileType: string, fileName: string;

        // a stream will be transformed to a buffer anyway: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/DataResolver.js#L117
        const buffer = await recordHelper.getRecordedVoiceAsBuffer(guildId, exportType, minutes, mapUserSettingsToDict(serverSettings));

        if (exportType === 'single') {
            fileType = AUDIO_CONTENT_TYPE;
            fileName = `${date}.mp3`;
        } else {
            fileType = 'application/zip';
            fileName = `${date}.zip`;
        }

        await interaction.editReply({
            content: '',
            files: [ {
                attachment: buffer,
                contentType: fileType,
                name: fileName,
            }],
        });
    },
};

export default command;
