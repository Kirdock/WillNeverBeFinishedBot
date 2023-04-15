import type { ChatCommand } from '../../../../interfaces/command';
import { hasPlayLock } from '../../../../services/musicPlayer';
import { voiceHelper } from '../../../../services/voiceHelper';
import { discordBot } from '../../../DiscordBot';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';

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
