import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    SlashCommandBuilder
} from 'discord.js';
import type { APIApplicationCommandOptionChoice } from 'discord.js';

export interface InteractionEphemeralResponse {
    content: string,
    ephemeral: false
}

export interface Command {
    data:  RESTPostAPIChatInputApplicationCommandsJSONBody | SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<string | InteractionEphemeralResponse>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>;
}