import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { buildSteamLinkOutOfMessage } from '../../utils/steam.utils';

const urlOptionName = 'url';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName('post-steam-link')
        .setDescription('Modifies a given Steam link so that it opens in the Steam client instead')
        .addStringOption((option) =>
            option
                .setName(urlOptionName)
                .setDescription('Steam Link')
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const url = interaction.options.getString(urlOptionName, true);
        const steamLink = buildSteamLinkOutOfMessage(url);
        return {
            content: steamLink || 'Hob kan Steam Link gfundn!',
            ephemeral: false
        };
    }
};

export default command;