import type { ChatCommand } from '../../../../interfaces/command';
import { PermissionsBitField } from 'discord.js';
import {
    getInteractionMetadata,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import { getCommandLangKey } from '../../commandLang';
import dataService from '../../../../services/data.service';

const { soundCommandName, soundOption, autocomplete } = getSoundSelection(true, true);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.DELETE_SOUND_NAME, CommandLangKey.DELETE_SOUND_DESCRIPTION)
        .addStringOption(soundOption)
        .toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);
        const fileName = interaction.options.getString(soundCommandName, true);
        const sound = await databaseHelper.getSoundMetaByName(fileName, guildId);

        if (!sound) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
        }

        if (sound.userId !== member.user.id && !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS);
        }

        await dataService.deleteSound(sound, member.id);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
