import type {
    APIApplicationCommandOptionChoice,
    ApplicationCommand,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    CommandInteraction,
    GuildResolvable,
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
    chatCommands = await readCommands(commandsPath, ApplicationCommandType.ChatInput);
    messageCommands = await readCommands(commandsPath, ApplicationCommandType.Message);
    allCommands = [...chatCommands, ...messageCommands];
}

async function readCommands(src: string, type: ApplicationCommandType.ChatInput): Promise<ChatCommand[]>
async function readCommands(src: string, type: ApplicationCommandType.Message): Promise<MessageCommand[]>
async function readCommands<T extends Command>(src: string, type: ApplicationCommandType.ChatInput | ApplicationCommandType.Message): Promise<T[]> {
    const subFolder = type === ApplicationCommandType.ChatInput ? 'slash' : 'messageContextMenu';
    const path = join(src, subFolder);
    const commandPaths = readdirSync(path).filter((file) => supportedExtensions.includes(extname(file)));
    const commands: T[] = [];

    for (const file of commandPaths) {
        const filePath = join(path, file);
        const command: T = (await import(filePath)).default;
        const isEnabled = command.enabled ?? true;

        if (command.data.type && command.data.type !== type) {
            logger.warn('Invalid application type', { filePath, type: command.data.type });
            continue;
        }

        if (isEnabled) {
            commands.push(command);
        }
    }
    return commands;
}

// DOC because Discord.js is unable to use JSDoc
/**
 * CHAT_INPUT    1    Slash commands; a text-based command that shows up when a user types /
 * USER          2    A UI-based command that shows up when you right click or tap on a user
 * MESSAGE       3    A UI-based command that shows up when you right click or tap on a message
 */
export async function setupApplicationCommands(client: Client<true>): Promise<void> {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isMessageContextMenuCommand()) {
            await handleMessageCommand(interaction);
            return;
        }

        if (interaction.isAutocomplete()) {
            await handleAutocompleteCommand(interaction);
            return;
        }

        if (interaction.isChatInputCommand()) {
            await handleChatInputCommand(interaction);
            return;
        }
    });
}

export async function getRegisteredApplicationCommands(client: Client<true>, guildId: string): Promise<Collection<string, ApplicationCommand<{guild: GuildResolvable}>>> {
    return await client.application.commands.fetch({ guildId });
}

export function getAvailableApplicationCommands(): Command[] {
    return allCommands;
}

export async function registerApplicationCommands(client: Client<true>, guildId: string, message?: Message): Promise<void> {
    let index = 0;

    for (const command of allCommands) {
        await client.application.commands.create(command.data, guildId);
        message?.edit(`${ ++index }/${ allCommands.length }`);
    }
}

export async function registerApplicationCommand(interaction: ChatInputCommandInteraction, guildId: string, commandName: string): Promise<void> {
    const command = allCommands.find((cmd) => cmd.data.name === commandName);
    if (!command) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_INVALID_COMMAND);
    }
    await interaction.client.application.commands.create(command.data, guildId);
}

export async function deleteApplicationCommand(interaction: ChatInputCommandInteraction, guildId: string, commandName: string): Promise<void> {
    const availableCommand = await getRegisteredApplicationCommands(interaction.client, guildId);
    const command = availableCommand.find((cmd) => cmd.name === commandName);
    if (!command) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_INVALID_COMMAND);
    }
    await interaction.client.application.commands.delete(command.id, guildId);
}

export async function unregisterApplicationCommands(client: Client<true>, guildId: string, statusMessage?: Message): Promise<void> {
    const currentCommands = await getRegisteredApplicationCommands(client, guildId);
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
    const command = findCommand(messageCommands, interaction.commandName);
    if (!command) {
        return;
    }
    await handleReply(command.execute(interaction), interaction);
}

function findCommand<T extends Command>(commands: T[], commandName: string): T | undefined {
    const command = commands.find((command) => command.data.name === commandName);

    if (!command) {
        logger.error(`No command matching command ${commandName} was found.`);
    }
    return command;
}

async function handleAutocompleteCommand(interaction: AutocompleteInteraction): Promise<void> {
    const command = findCommand(chatCommands, interaction.commandName);

    if (!command?.autocomplete) {
        command && logger.error('Found command does not have an autocomplete method', interaction.commandName);
        return;
    }

    const choices = await command.autocomplete(interaction);
    const normalizedChoices = normalizeChoices(choices);
    await interaction.respond(normalizedChoices);
}

async function handleChatInputCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = findCommand(chatCommands, interaction.commandName);

    if (!command) {
        return;
    }

    await handleReply(command.execute(interaction), interaction);
}

async function handleReply(replyResponse: InteractionExecuteResponse, interaction:  CommandInteraction) {
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

async function getReply(reply: InteractionExecuteResponse, interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
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

export function handleInteractionError(error: unknown, interaction: CommandInteraction): string {
    if (error instanceof InteractionError) {
        return error.message;
    }
    return getCommandLangKey(interaction, CommandLangKey.ERRORS_UNKNOWN);
}
