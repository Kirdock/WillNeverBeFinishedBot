import type { ChatCommand } from '../../../../interfaces/command';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import {
    getInteractionMetadata,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils';

const { soundCommandName, soundOption, autocomplete } = getSoundSelection();

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.SET_INTRO_NAME, CommandLangKey.SET_INTRO_DESCRIPTION)
        .addStringOption(soundOption).toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);
        const fileName = interaction.options.getString(soundCommandName, true);

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
