import type { ChatCommand, InteractionExecuteResponse } from '../../../../interfaces/command';
import type { ChatInputCommandInteraction } from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import {
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder,
    getSoundSelection,
    getUserOption
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';


const { soundOption, soundCommandName, autocomplete } = getSoundSelection();
const { userCommandName, userOption } = getUserOption(true);
const setCommandName = getDefaultCommandLang(CommandLangKey.ADMIN_SET_USER_INTRO_NAME);

const command: ChatCommand = {
    // data: getLangSlashCommandBuilder(CommandLangKey.DELETE_USER_INTRO_NAME, CommandLangKey.DELETE_USER_INTRO_DESCRIPTION)
    data: getLangSlashCommandBuilder(CommandLangKey.ADMIN_USER_INTRO_NAME, CommandLangKey.ADMIN_USER_INTRO_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand((option) =>
            getLangComponent(option, CommandLangKey.ADMIN_SET_USER_INTRO_NAME, CommandLangKey.ADMIN_SET_USER_INTRO_DESCRIPTION)
                .addUserOption(userOption)
                .addStringOption(soundOption)
        ).addSubcommand((option) =>
            getLangComponent(option, CommandLangKey.ADMIN_DELETE_USER_INTRO_NAME, CommandLangKey.ADMIN_DELETE_USER_INTRO_DESCRIPTION)
                .addUserOption(userOption)
        ).toJSON(),
    autocomplete,
    async execute(interaction) {
        const subCommandName = interaction.options.getSubcommand(true);
        if (subCommandName === setCommandName) {
            return setUserIntro(interaction);
        } else {
            return deleteUserIntro(interaction);
        }
    },
};

async function setUserIntro(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const fileName = interaction.options.getString(soundCommandName, true);
    const user = interaction.options.getUser(userCommandName, true);

    const meta = await databaseHelper.getSoundMetaByName(fileName, guildId);
    if (!meta) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
    }

    await databaseHelper.setIntro(user.id, meta._id, guildId, false);

    return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
}
async function deleteUserIntro(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const user = interaction.options.getUser(userCommandName, true);

    await databaseHelper.setIntro(user.id, undefined, guildId);

    return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
}

export default command;
