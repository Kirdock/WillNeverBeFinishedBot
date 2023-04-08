import type {
    APIApplicationCommandOptionChoice,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    SlashCommandBuilder
} from 'discord.js';
import type { BaseMessageOptions } from 'discord.js';

export interface InteractionEphemeralResponse {
    content: string;
    ephemeral: false;
}

export interface InteractionFileResponse {
    files: BaseMessageOptions['files'];
    ephemeral: false;
}

export interface Command {
    data:  RESTPostAPIChatInputApplicationCommandsJSONBody | SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<string | InteractionEphemeralResponse | InteractionFileResponse>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>;
}