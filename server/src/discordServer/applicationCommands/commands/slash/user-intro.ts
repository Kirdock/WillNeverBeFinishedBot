import type { ChatCommand, InteractionExecuteResponse } from '../../../../interfaces/command';
import {
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import type { ChatInputCommandInteraction } from 'discord.js';

const { soundCommandName, soundOption, autocomplete } = getSoundSelection();
const setIntroName = getDefaultCommandLang(CommandLangKey.INTRO_SET_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.INTRO_NAME, CommandLangKey.INTRO_DESCRIPTION)
        .addSubcommand((option) =>
            getLangComponent(option, CommandLangKey.INTRO_SET_NAME, CommandLangKey.INTRO_SET_DESCRIPTION)
                .addStringOption(soundOption)
        ).addSubcommand((option) =>
            getLangComponent(option, CommandLangKey.INTRO_REMOVE_NAME, CommandLangKey.INTRO_REMOVE_DESCRIPTION)
        ).toJSON(),
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand(true);

        if (subCommand === setIntroName) {
            return await setIntro(interaction);
        }
        return await removeIntro(interaction);
    },
    autocomplete,
};

async function setIntro(interaction: ChatInputCommandInteraction): Promise<InteractionExecuteResponse> {
    const { member, guildId } = getInteractionMetadata(interaction);
    const fileName = interaction.options.getString(soundCommandName, true);

    const meta = await databaseHelper.getSoundMetaByName(fileName, guildId);
    if (!meta) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
    }

    try {
        await databaseHelper.setIntro(member.id, meta._id, guildId);
        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    } catch {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_INTRO_TOO_LONG);
    }
}

async function removeIntro(interaction: ChatInputCommandInteraction): Promise<InteractionExecuteResponse> {
    const { member, guildId } = getInteractionMetadata(interaction);
    await databaseHelper.setIntro(member.id, undefined, guildId);

    return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
}

export default command;
