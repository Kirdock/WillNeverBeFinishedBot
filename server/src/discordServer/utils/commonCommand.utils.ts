import { getCommandLangKey } from '../applicationCommands/commandLang';
import { CommandLangKey } from '../applicationCommands/types/lang.types';
import type {
    ChatInputCommandInteraction,
    InteractionResponse,
    MessageContextMenuCommandInteraction
} from 'discord.js';

export function setLoading(interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction, ephemeral = true): Promise<InteractionResponse<boolean>> {
    return interaction.reply({
        content: getCommandLangKey(interaction, CommandLangKey.LOADING),
        ephemeral: ephemeral,
    });
}