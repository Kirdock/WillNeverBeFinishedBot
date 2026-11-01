import { voiceHelper } from '../../../../services/voiceHelper.js';
import type { ChatCommand } from '../../../../interfaces/command.js';
import { getCommandLangKey } from '../../commandLang.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils.js';

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.JOIN_NAME, CommandLangKey.JOIN_DESCRIPTION)
        .toJSON(),
    async execute(interaction): Promise<string> {
        const { member, guildId } = getInteractionMetadata(interaction);

        await voiceHelper.joinVoiceChannelThroughMember(member, guildId, interaction.locale);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
};

export default command;
