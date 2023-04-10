import type {
    APIApplicationCommandOptionChoice,
    ApplicationCommandType,
    AutocompleteInteraction,
    BaseMessageOptions,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
    SlashCommandBuilder
} from 'discord.js';

export interface InteractionEphemeralResponse {
    content: string;
    ephemeral: false;
}

export interface InteractionFileResponse {
    files: BaseMessageOptions['files'];
    ephemeral: false;
}

export type InteractionExecuteResponse = Promise<string | InteractionEphemeralResponse | InteractionFileResponse | void>;
export type InteractionAutocomplete = (interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>;

interface BaseCommand {
    enabled?: boolean;
}

export interface ChatCommand extends BaseCommand{
    data:  RESTPostAPIChatInputApplicationCommandsJSONBody | SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => InteractionExecuteResponse;
    autocomplete?: InteractionAutocomplete;
    type: ApplicationCommandType.ChatInput,
}

export interface MessageCommand extends BaseCommand {
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody | ContextMenuCommandBuilder;
    execute: (interaction: MessageContextMenuCommandInteraction) => InteractionExecuteResponse;
    type: ApplicationCommandType.Message
    enabled?: boolean;
}

export type Command = ChatCommand | MessageCommand;
