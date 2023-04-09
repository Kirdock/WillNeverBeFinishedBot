import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import {
    getInteractionMetadata,
    getScopedSlashCommandBuilder,
    getSoundSelection
} from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import { databaseHelper } from '../../../services/databaseHelper';
import { getCommandLangKey } from '../commandLang';
import { createReadStream } from 'fs';
import { AUDIO_CONTENT_TYPE } from '../../constants';

const { fileNameOption, fileCommandName, autocomplete } = getSoundSelection(true);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.DOWNLOAD_NAME, CommandLangKey.DOWNLOAD_DESCRIPTION)
        .addStringOption(fileNameOption)
        .toJSON(),
    async execute(interaction) {
        const fileName = interaction.options.getString(fileCommandName, true);
        const { guildId } = getInteractionMetadata(interaction);
        const sound = await databaseHelper.getSoundMetaByName(fileName, guildId);

        if (!sound) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
        }

        await interaction.reply({
            files: [ {
                attachment: createReadStream(sound.path),
                contentType: AUDIO_CONTENT_TYPE,
                name: `${fileName}.mp3`,
            }],
            ephemeral: true
        });
    },
    autocomplete,
};

export default command;
