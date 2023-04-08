import type { ChatInputCommandInteraction, Client, Guild, InteractionReplyOptions } from 'discord.js';
import { Events, GuildMember } from 'discord.js';
import { extname, join } from 'path';
import { readdirSync } from 'fs';
import { scopedLogger } from '../../services/logHelper';
import { InteractionError } from '../../utils/InteractionError';
import type { Command } from '../../interfaces/command';
import {
    APPLICATION_COMMAND_CHOICE_NAME,
    APPLICATION_COMMAND_CHOICE_VALUE,
    APPLICATION_COMMAND_MAX_CHOICES
} from '../limits';

const logger = scopedLogger('APPLICATION_COMMANDS')
const commandsPath = join(__dirname, './commands');
const supportedExtensions: string[] = ['.js', '.ts'];
let commands: Command[] = [];

export async function readApplicationCommands(): Promise<void> {
    const commandsRead: Command[] = [];
    const commandFiles = readdirSync(commandsPath).filter((file) => supportedExtensions.some(extension => extname(file) === extension));
    for (const file of commandFiles) {
        const command: Command = (await import(join(commandsPath, file))).default;
        commandsRead.push(command);
    }
    commands = commandsRead;
}

export async function unregisterApplicationCommands(client: Client<true>): Promise<void> {
    const currentCommands = await client.application.commands.fetch();
    for (const [commandId, command] of currentCommands) {
        try {
            await client.application.commands.delete(commandId);
        } catch (error) {
            logger.error(error, { message: 'error while deleting the application command', commandName: command.name });
        }
    }
}

// DOC because Discord.js is unable to use JSDoc
/**
 * CHAT_INPUT    1    Slash commands; a text-based command that shows up when a user types /
 * USER          2    A UI-based command that shows up when you right click or tap on a user
 * MESSAGE       3    A UI-based command that shows up when you right click or tap on a message
 */
export async function setupApplicationCommands(client: Client<true>): Promise<void> {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isAutocomplete() && !interaction.isChatInputCommand()) {
            return;
        }
        const command = commands.find((command) => command.data.name === interaction.commandName);
        if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        if (interaction.isAutocomplete()) {
            if (!command.autocomplete) {
                return;
            }

            const choices = await command.autocomplete(interaction);
            // make sure that all choices are valid
            choices.map(choice => (
                {
                    value: typeof choice.value === 'string' ? choice.value.substring(0, APPLICATION_COMMAND_CHOICE_VALUE) : choice.value,
                    name: choice.name.substring(0, APPLICATION_COMMAND_CHOICE_NAME),
                }
            )).slice(0, APPLICATION_COMMAND_MAX_CHOICES);
            await interaction.respond(choices);
            return;
        }

        const reply = await getReply(interaction, command);

        interaction.reply(reply);
    });
}

/**
 *
 * @param interaction
 * @param command
 * @throws never
 */
async function getReply(interaction: ChatInputCommandInteraction, command: Command): Promise<InteractionReplyOptions> {
    try {
        const interactionReply = await command.execute(interaction);
        if (typeof interactionReply === 'string') {
            return {
                content: interactionReply,
                ephemeral: true
            };
        } else {
            return interactionReply;
        }
    } catch (error) {
        logger.error(error, `Error executing ${interaction.commandName}`);
        return {
            content: handleInteractionError(error),
            ephemeral: true,
        };
    }
}

export async function registerApplicationCommands(client: Client<true>): Promise<void> {
    for (const command of commands) {
        await client.application.commands.create(command.data);
    }
}

export async function getInteractionMetadata(interaction: ChatInputCommandInteraction): Promise<{member: GuildMember, guild: Guild}> {
    let member = interaction.member;
    if (!member) {
        throw new InteractionError('invalid member');
    }
    const guild = interaction.inCachedGuild() ? await interaction.guild.fetch() : interaction.guild;
    if (!guild) {
        throw new InteractionError('Invalid guild');
    }

    if (!(member instanceof GuildMember)) {
        member = await guild.members.fetch(member.user.id);
    }
    if (!member.voice.channelId) {
        throw new InteractionError(`Member ${member.user.username} is not in a voice channel!`);
    }

    return { member, guild };
}

export function handleInteractionError(error: unknown): string {
    if (error instanceof InteractionError) {
        return error.message;
    }
    return 'Unknown error happened!';
}