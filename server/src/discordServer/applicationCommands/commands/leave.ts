import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';
import { getInteractionMetadata } from '../applicationManager';
import { hasPlayLock } from '../../../services/musicPlayer';
import { voiceHelper } from '../../../services/voiceHelper';
import { discordBot } from '../../DiscordBot';

const command: Command = {
    data: new SlashCommandBuilder().setName('leave').setDescription('Bot leaves the voice channel').toJSON(),
    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);

        if (!hasPlayLock(guild.id) || await discordBot.isUserAdminInServer(member.id, guild.id)) {
            voiceHelper.disconnectVoice(guild.id);
            return 'disconnected';
        }
        return 'Insufficient permission!';
    }
}

export default command;