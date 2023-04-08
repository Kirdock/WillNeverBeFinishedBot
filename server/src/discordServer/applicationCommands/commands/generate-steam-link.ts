import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import { buildSteamLinkOutOfMessage } from '../../utils/steam.utils';

const command: Command = {
    type: ApplicationCommandType.Message,
    data: new ContextMenuCommandBuilder().setName('Gib Steam Link').setType(ApplicationCommandType.Message).toJSON(),
    async execute(interaction) {
        const steamLink = buildSteamLinkOutOfMessage(interaction.targetMessage.content);
        return {
            content: steamLink || 'Hob kan Steam Link gfundn!',
            ephemeral: false,
        };
    },
};

export default command;