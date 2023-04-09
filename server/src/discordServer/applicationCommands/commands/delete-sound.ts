// PERMISSION: CREATOR or ADMIN

import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { getScopedSlashCommandBuilder, getSoundSelection } from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import { databaseHelper } from '../../../services/databaseHelper';
import { getCommandLangKey } from '../commandLang';
import { getInteractionMetadata } from '../applicationManager';

const { fileCommandName, fileNameOption, autocomplete } = getSoundSelection(true, true);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.DELETE_SOUND_NAME, CommandLangKey.DELETE_SOUND_DESCRIPTION)
        .addStringOption(fileNameOption)
        .toJSON(),
    async execute(interaction) {
        const { member } = await getInteractionMetadata(interaction);
        const fileName = interaction.options.getString(fileCommandName, true);
        const sound = await databaseHelper.getSoundMetaByName(fileName);

        if (!sound) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
        }

        if (sound.userId !== member.id && !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS);
        }

        await databaseHelper.removeSoundMeta(sound._id.toHexString());

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
