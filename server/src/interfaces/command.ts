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

export type InteractionExecuteResponse = Promise<string | InteractionEphemeralResponse | InteractionFileResponse>;

export interface ChatCommand {
    data:  RESTPostAPIChatInputApplicationCommandsJSONBody | SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => InteractionExecuteResponse;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>;
    type: ApplicationCommandType.ChatInput,
}

export interface MessageCommand {
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody | ContextMenuCommandBuilder;
    execute: (interaction: MessageContextMenuCommandInteraction) => InteractionExecuteResponse;
    type: ApplicationCommandType.Message
}

export type Command = ChatCommand | MessageCommand;
