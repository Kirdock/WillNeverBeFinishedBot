import type { ChatCommand } from '../../../../interfaces/command';
import {
    getInteractionMetadata,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import { getCommandLangKey } from '../../commandLang';
import { createReadStream } from 'fs';
import { AUDIO_CONTENT_TYPE } from '../../../constants';
import { MessageFlags } from 'discord.js';

const { soundOption, soundCommandName, autocomplete } = getSoundSelection(true);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.DOWNLOAD_NAME, CommandLangKey.DOWNLOAD_DESCRIPTION)
        .addStringOption(soundOption)
        .toJSON(),
    async execute(interaction) {
        const fileName = interaction.options.getString(soundCommandName, true);
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
            flags: MessageFlags.Ephemeral,
        });
    },
    autocomplete,
};

export default command;
