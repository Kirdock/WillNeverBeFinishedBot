import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import { getInteractionMetadata } from '../applicationManager';
import { databaseHelper } from '../../../services/databaseHelper';
import { getCommandLangKey } from '../commandLang';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.DELETE_INTRO_NAME, CommandLangKey.DELETE_INTRO_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);

        await databaseHelper.setIntro(member.id, undefined, guild.id);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
