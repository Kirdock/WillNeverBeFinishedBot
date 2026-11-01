import type { ChatCommand } from '../../../../interfaces/command.js';
import {
    getInteractionMetadata,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { databaseHelper } from '../../../../services/databaseHelper.js';
import { getCommandLangKey } from '../../commandLang.js';
import { createReadStream } from 'fs';
import { AUDIO_CONTENT_TYPE } from '../../../constants.js';
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
