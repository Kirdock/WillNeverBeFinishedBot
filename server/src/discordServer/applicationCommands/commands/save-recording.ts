import { recordHelper } from '../../../services/recordHelper';
import type { Command } from '../../../interfaces/command';
import type { APIApplicationCommandOptionChoice } from 'discord.js';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import type { AudioExportType } from '@kirdock/discordjs-voice-recorder';
import { databaseHelper } from '../../../services/databaseHelper';
import { mapUserSettingsToDict } from '../../../utils/convertion.utils';
import { getInteractionMetadata } from '../applicationManager';
import { getCommandLang, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { setLoading } from '../../utils/commonCommand.utils';

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

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.SAVE_RECORDING_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.SAVE_RECORDING_DESCRIPTION))
        .addIntegerOption((option) =>
            option
                .setName(minutesName)
                .setNameLocalizations(getCommandLang(CommandLangKey.SAVE_RECORDING_MINUTES_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_MINUTES_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.SAVE_RECORDING_MINUTES_DESCRIPTION))
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addStringOption((option) =>
            option
                .setName(typeName)
                .setNameLocalizations(getCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.SAVE_RECORDING_TYPE_DESCRIPTION))
                .setChoices(...choices)
        )
        .toJSON(),
    async execute (interaction) {
        const { guild } = await getInteractionMetadata(interaction);
        const messagePromise = setLoading(interaction, false);
        const minutes = interaction.options.getInteger(minutesName) ?? undefined;
        const exportType = (interaction.options.getString(typeName) as AudioExportType | null) ?? undefined;
        const serverSettings = await databaseHelper.getServerSettings(guild.id);
        const readable = await recordHelper.getRecordedVoiceAsReadable(guild.id, exportType, minutes, mapUserSettingsToDict(serverSettings));
        const date = new Date().toISOString();
        let fileType: string, fileName: string;

        if (exportType === 'single') {
            fileType = 'audio/mp3';
            fileName = `${date}.mp3`;
        } else {
            fileType = 'application/zip';
            fileName = `${date}.zip`;
        }

        const message = await messagePromise;
        await message.edit({
            files: [ {
                attachment: readable,
                contentType: fileType,
                name: fileName,
            }],
        });
    },
};

export default command;