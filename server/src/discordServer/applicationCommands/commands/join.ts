import { getInteractionMetadata } from '../applicationManager';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { voiceHelper } from '../../../services/voiceHelper';
import type { Command } from '../../../interfaces/command';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder().setName('join').setDescription('Joins the voice channel the user is in').toJSON(),
    async execute(interaction): Promise<string> {
        const { member, guild } = await getInteractionMetadata(interaction);
        await voiceHelper.joinVoiceChannelThroughMember(member, guild);
        return 'joined';
    }
}

export default command;