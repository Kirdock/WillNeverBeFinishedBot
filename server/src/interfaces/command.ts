import type {
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    SlashCommandBuilder
} from 'discord.js';

export interface InteractionEphemeralResponse {
    content: string,
    ephemeral: false
}

export interface Command {
    data:  RESTPostAPIChatInputApplicationCommandsJSONBody | SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<string | InteractionEphemeralResponse>;
}