import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';

const command: Command = {
    type: ApplicationCommandType.Message,
    data: new ContextMenuCommandBuilder().setName('Gib Steam Link').setType(ApplicationCommandType.Message).toJSON(),
    async execute(interaction) {
        const steamLink = buildSteamLinkOutOfMessage(interaction.targetMessage.content);
        return {
            content: steamLink || 'Hob kan Steam Link gfundn!',
            ephemeral: false
        };
    }
};

function buildSteamLinkOutOfMessage(content: string): string | undefined {
    const urlRegex = /(https:\/\/(store\.steampowered|steamcommunity)\.com\/[^\s]+)/g;
    let url = content.match(urlRegex)?.[0];
    if (url) {
        url = `steam://openurl/${url}`;
    }
    return url;
}

export default command;