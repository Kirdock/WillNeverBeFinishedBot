import type {
    APIApplicationCommandOptionChoice,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    InteractionReplyOptions,
    Message,
    MessageContextMenuCommandInteraction
} from 'discord.js';
import { ApplicationCommandType, Events } from 'discord.js';
import { extname, join } from 'path';
import { readdirSync } from 'fs';
import { scopedLogger } from '../../services/logHelper';
import { InteractionError } from '../../utils/InteractionError';
import type { ChatCommand, Command, InteractionExecuteResponse, MessageCommand } from '../../interfaces/command';
import {
    APPLICATION_COMMAND_CHOICE_NAME,
    APPLICATION_COMMAND_CHOICE_VALUE,
    APPLICATION_COMMAND_MAX_CHOICES
} from '../constants';
import { getCommandLangKey } from './commandLang';
import { CommandLangKey } from './types/lang.types';

const logger = scopedLogger('APPLICATION_COMMANDS');
const commandsPath = join(__dirname, './commands');
const supportedExtensions: string[] = ['.js', '.ts'];
let chatCommands: ChatCommand[] = [];
let messageCommands: MessageCommand[] = [];
let allCommands: Command[] = [];


export async function readApplicationCommands(): Promise<void> {
    chatCommands = [];
    messageCommands = [];

    const commandFiles = readdirSync(commandsPath).filter((file) => supportedExtensions.some((extension) => extname(file) === extension));
    for (const file of commandFiles) {
        const command: Command = (await import(join(commandsPath, file))).default;
        const isEnabled = command.enabled ?? true;
        if (!isEnabled) {
            continue;
        }

        if (command.type === ApplicationCommandType.ChatInput) {
            chatCommands.push(command);
        } else {
            messageCommands.push(command);
        }
    }
    allCommands = [...chatCommands, ...messageCommands];
}

// DOC because Discord.js is unable to use JSDoc
/**
 * CHAT_INPUT    1    Slash commands; a text-based command that shows up when a user types /
 * USER          2    A UI-based command that shows up when you right click or tap on a user
 * MESSAGE       3    A UI-based command that shows up when you right click or tap on a message
 */
export async function setupApplicationCommands(client: Client<true>): Promise<void> {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isAutocomplete() && !interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) {
            return;
        }

        if (interaction.isMessageContextMenuCommand()) {
            await handleMessageCommand(interaction);
            return;
        }

        await handleChatInputCommand(interaction);
    });
}

export async function registerApplicationCommands(client: Client<true>, guildId: string, message?: Message): Promise<void> {
    let index = 0;

    for (const command of allCommands) {
        await client.application.commands.create(command.data, guildId);
        message?.edit(`${ ++index }/${ allCommands.length }`);
    }
}

export async function unregisterApplicationCommands(client: Client<true>, guildId: string, statusMessage?: Message): Promise<void> {
    const currentCommands = await client.application.commands.fetch({ guildId });
    let index = 0;
    for (const [, command] of currentCommands) {
        try {
            await client.application.commands.delete(command.id, command.guildId ?? undefined);
        } catch (error) {
            logger.error(error, { message: 'error while deleting the application command', commandName: command.name });
        }
        statusMessage?.edit(`${++index}/${currentCommands.size}`);
    }
}

function normalizeChoices(choices: APIApplicationCommandOptionChoice[]): APIApplicationCommandOptionChoice[] {
    return choices.map<APIApplicationCommandOptionChoice>((choice) => (
        {
            value: typeof choice.value === 'string' ? choice.value.substring(0, APPLICATION_COMMAND_CHOICE_VALUE) : choice.value,
            name: choice.name.substring(0, APPLICATION_COMMAND_CHOICE_NAME),
        }
    )).slice(0, APPLICATION_COMMAND_MAX_CHOICES);
}

async function handleMessageCommand(interaction: MessageContextMenuCommandInteraction): Promise<void> {
    const command = messageCommands.find((command) => command.data.name === interaction.commandName);
    if (!command) {
        logger.error(`No command matching message command ${interaction.commandName} was found.`);
        return;
    }
    await handleReply(command.execute(interaction), interaction);
}

async function handleChatInputCommand(interaction: AutocompleteInteraction | ChatInputCommandInteraction): Promise<void> {
    const command = chatCommands.find((command) => command.data.name === interaction.commandName);

    if (!command) {
        logger.error(`No command matching chat command ${interaction.commandName} was found.`);
        return;
    }

    if (!interaction.isAutocomplete()) {
        await handleReply(command.execute(interaction), interaction);
        return;
    }

    if (!command.autocomplete) {
        return;
    }

    const choices = await command.autocomplete(interaction);

    const normalizedChoices = normalizeChoices(choices);
    await interaction.respond(normalizedChoices);
}

async function handleReply(replyResponse: InteractionExecuteResponse, interaction:  ChatInputCommandInteraction | MessageContextMenuCommandInteraction) {
    const reply = await getReply(replyResponse, interaction);
    if (!reply) {
        // reply is handled by command
        return;
    }

    try {
        await interaction.reply(reply);
    } catch {
        // handle interaction timeout? (3 sec)
    }
}

async function getReply(reply: InteractionExecuteResponse, interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction): Promise<InteractionReplyOptions | void> {
    try {
        const interactionReply = await reply;
        if (typeof interactionReply === 'string') {
            return {
                content: interactionReply,
                ephemeral: true,
            };
        } else {
            return interactionReply;
        }
    } catch (error) {
        logger.error(error, `Error executing ${interaction.commandName}`);
        return {
            content: handleInteractionError(error, interaction),
            ephemeral: true,
        };
    }
}

export function handleInteractionError(error: unknown, interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction): string {
    if (error instanceof InteractionError) {
        return error.message;
    }
    return getCommandLangKey(interaction, CommandLangKey.ERRORS_UNKNOWN);
}
