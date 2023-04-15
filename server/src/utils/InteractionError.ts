import type { BaseInteraction } from 'discord.js';
import type { LocaleString } from 'discord.js';
import { getCommandLangKey } from '../discordServer/applicationCommands/commandLang';
import type { CommandLangKey } from '../discordServer/applicationCommands/types/lang.types';

export class InteractionError extends Error {
    public message: string;

    constructor(interaction: BaseInteraction | LocaleString, key: CommandLangKey) {
        super();
        this.message = getCommandLangKey(interaction, key);
    }
}
