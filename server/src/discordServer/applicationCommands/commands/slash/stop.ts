import type { ChatCommand } from '../../../../interfaces/command.js';
import { stopPlaying } from '../../../../services/musicPlayer.js';
import { discordBot } from '../../../DiscordBot.js';
import { getCommandLangKey } from '../../commandLang.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils.js';

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
