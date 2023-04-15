import { voiceHelper } from '../../../../services/voiceHelper';
import type { ChatCommand } from '../../../../interfaces/command';
import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getInteractionMetadata, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';

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
