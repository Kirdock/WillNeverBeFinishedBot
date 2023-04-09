import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { getScopedSlashCommandBuilder, getUserOption } from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import { databaseHelper } from '../../../services/databaseHelper';
import { getCommandLangKey } from '../commandLang';

const { userCommandName, userOption } = getUserOption(true);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.DELETE_USER_INTRO_NAME, CommandLangKey.DELETE_USER_INTRO_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(userOption)
        .toJSON(),
    async execute(interaction) {
        if (!interaction.guildId) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_GUILD);
        }
        const user = interaction.options.getUser(userCommandName, true);

        await databaseHelper.setIntro(user.id, undefined, interaction.guildId);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
