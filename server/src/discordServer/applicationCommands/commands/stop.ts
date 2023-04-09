import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { stopPlaying } from '../../../services/musicPlayer';
import { getInteractionMetadata } from '../applicationManager';
import { discordBot } from '../../DiscordBot';
import { getCommandLangKey } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.STOP_NAME, CommandLangKey.STOP_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);

        await stopPlaying(guild.id, discordBot.isSuperAdmin(member.id));

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
