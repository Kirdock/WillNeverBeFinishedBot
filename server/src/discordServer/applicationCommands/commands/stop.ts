import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';
import { stopPlaying } from '../../../services/musicPlayer';
import { getInteractionMetadata } from '../applicationManager';
import { discordBot } from '../../DiscordBot';

const command: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stops the bot from playing').toJSON(),
    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);

        await stopPlaying(guild.id, discordBot.isSuperAdmin(member.id));

        return 'stopped';
    }
};

export default command;