import { Events } from 'discord.js';
import { registerApplicationCommands } from '../applicationCommands/applicationManager';
import type { DiscordBot } from '../DiscordBot';
import { scopedLogger } from '../../services/logHelper';

const logger = scopedLogger('ON_MESSAGE_CREATE')

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
        if (await discordBot.isUserAdminInServer(message.member.id, message.guildId)) {
            void message.channel.sendTyping();
            try {
                await registerApplicationCommands(discordBot.client);
                await message.reply('Done!');
            } catch (e) {
                logger.error(e, 'Failed to register slash commands');
                await message.reply('Oopsie Woopsie! Uwu We made a fucky wucky!! A wittle fucko boingo! The code monkeys at our headquarters are working VEWY HAWD to fix this!');
            }


        } else {
            await message.reply('Insufficient permission!');
        }
    })
}