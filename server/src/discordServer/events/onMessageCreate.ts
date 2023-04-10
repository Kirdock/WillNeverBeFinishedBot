import { Events, PermissionsBitField } from 'discord.js';
import { registerApplicationCommands } from '../applicationCommands/applicationManager';
import type { DiscordBot } from '../DiscordBot';
import { scopedLogger } from '../../services/logHelper';

const logger = scopedLogger('ON_MESSAGE_CREATE');

export default function onMessageCreate(discordBot: DiscordBot): void {
    const clientMention = `<@${discordBot.client.user.id}>`;

    discordBot.client.on(Events.MessageCreate, async (message) => {
        if (!message.member || !message.guildId || !message.content.startsWith(clientMention)) {
            return;
        }

        const content = message.content.substring(clientMention.length).trim();
        if (content !== 'register') {
            return;
        }
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            await message.reply('Insufficient permission!');
            return;
        }

        const statusMessage = await message.channel.send('Loading...');
        try {
            await registerApplicationCommands(discordBot.client, message.guildId, statusMessage);
            await statusMessage.edit('Done!');
        } catch (e) {
            logger.error(e, 'Failed to register slash commands');
            await statusMessage.edit('Oopsie Woopsie! Uwu We made a fucky wucky!! A wittle fucko boingo! The code monkeys at our headquarters are working VEWY HAWD to fix this!');
        }
    });
}
