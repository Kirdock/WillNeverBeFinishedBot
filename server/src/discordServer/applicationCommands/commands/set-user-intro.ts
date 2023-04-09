import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { databaseHelper } from '../../../services/databaseHelper';
import {
    getInteractionMetadata,
    getScopedSlashCommandBuilder,
    getSoundSelection,
    getUserOption
} from '../../utils/commonCommand.utils';

const { fileNameOption, fileCommandName, autocomplete } = getSoundSelection();
const { userCommandName, userOption } = getUserOption();

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.SET_USER_INTRO_NAME, CommandLangKey.SET_USER_INTRO_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(fileNameOption)
        .addUserOption(userOption).toJSON(),
    async execute(interaction) {
        const { guildId } = getInteractionMetadata(interaction);
        const fileName = interaction.options.getString(fileCommandName, true);
        const user = interaction.options.getUser(userCommandName, true);

        const meta = await databaseHelper.getSoundMetaByName(fileName, guildId);
        if (!meta) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
        }

        await databaseHelper.setIntro(user.id, meta._id, guildId);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
