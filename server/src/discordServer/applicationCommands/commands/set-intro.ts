import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { databaseHelper } from '../../../services/databaseHelper';
import {
    getInteractionMetadata,
    getScopedSlashCommandBuilder,
    getSoundSelection
} from '../../utils/commonCommand.utils';

const { fileCommandName, fileNameOption, autocomplete } = getSoundSelection();

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.SET_INTRO_NAME, CommandLangKey.SET_INTRO_DESCRIPTION)
        .addStringOption(fileNameOption).toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);
        const fileName = interaction.options.getString(fileCommandName, true);

        const meta = await databaseHelper.getSoundMetaByName(fileName, guildId);
        if (!meta) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
        }

        await databaseHelper.setIntro(member.id, meta._id, guildId);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
