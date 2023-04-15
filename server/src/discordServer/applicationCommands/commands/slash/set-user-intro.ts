import type { ChatCommand } from '../../../../interfaces/command';
import { PermissionsBitField } from 'discord.js';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import {
    getInteractionMetadata,
    getLangSlashCommandBuilder,
    getSoundSelection,
    getUserOption
} from '../../../utils/commonCommand.utils';

const { soundOption, soundCommandName, autocomplete } = getSoundSelection();
const { userCommandName, userOption } = getUserOption();

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.SET_USER_INTRO_NAME, CommandLangKey.SET_USER_INTRO_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(soundOption)
        .addUserOption(userOption).toJSON(),
    async execute(interaction) {
        const { guildId } = getInteractionMetadata(interaction);
        const fileName = interaction.options.getString(soundCommandName, true);
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
