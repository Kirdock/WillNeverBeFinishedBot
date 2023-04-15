import type { ChatCommand } from '../../../../interfaces/command';
import { stopPlaying } from '../../../../services/musicPlayer';
import { discordBot } from '../../../DiscordBot';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.STOP_NAME, CommandLangKey.STOP_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);

        await stopPlaying(guildId, discordBot.isSuperAdmin(member.id));

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
