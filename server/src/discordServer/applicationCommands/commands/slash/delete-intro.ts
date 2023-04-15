import type { ChatCommand } from '../../../../interfaces/command';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import { databaseHelper } from '../../../../services/databaseHelper';
import { getCommandLangKey } from '../../commandLang';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.DELETE_INTRO_NAME, CommandLangKey.DELETE_INTRO_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);

        await databaseHelper.setIntro(member.id, undefined, guildId);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
