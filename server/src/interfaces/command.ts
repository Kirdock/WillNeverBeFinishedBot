import type {
    APIApplicationCommandOptionChoice,
    AutocompleteInteraction,
    BaseMessageOptions,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder, InteractionReplyOptions,
    MessageContextMenuCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody
} from 'discord.js';

export interface InteractionEphemeralResponse {
    content: string;
    flags?: InteractionReplyOptions['flags'];
}

export interface InteractionFileResponse {
    files: BaseMessageOptions['files'];
    flags?: InteractionReplyOptions['flags'];
}

export type InteractionExecuteResponse = Promise<string | InteractionEphemeralResponse | InteractionFileResponse | void>;
export type InteractionAutocomplete = (interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>;

interface BaseCommand {
    enabled?: boolean;
}

export interface ChatCommand extends BaseCommand{
    data:  RESTPostAPIChatInputApplicationCommandsJSONBody;
    execute: (interaction: ChatInputCommandInteraction) => InteractionExecuteResponse;
    autocomplete?: InteractionAutocomplete;
}

export interface MessageCommand extends BaseCommand {
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody | ContextMenuCommandBuilder;
    execute: (interaction: MessageContextMenuCommandInteraction) => InteractionExecuteResponse;
    enabled?: boolean;
}

export type Command = ChatCommand | MessageCommand;
