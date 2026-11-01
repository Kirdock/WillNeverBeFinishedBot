import type { ChatCommand } from '../../../../interfaces/command.js';
import { hasPlayLock } from '../../../../services/musicPlayer.js';
import { voiceHelper } from '../../../../services/voiceHelper.js';
import { discordBot } from '../../../DiscordBot.js';
import { getCommandLangKey } from '../../commandLang.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils.js';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.LEAVE_NAME, CommandLangKey.LEAVE_DESCRIPTION)
        .toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);

        if (!hasPlayLock(guildId) || await discordBot.isUserAdminInServer(member.id, guildId)) {
            voiceHelper.disconnectVoice(guildId);
            return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
        }
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS);
    },
};

export default command;
