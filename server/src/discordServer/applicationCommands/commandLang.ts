import { deCommandLanguage } from './languageFiles/de';
import { enCommandLanguage } from './languageFiles/en';
import type { ChatInputCommandInteraction, MessageContextMenuCommandInteraction } from 'discord.js';
import type { CommandLangKey, CommandLanguageFile, SupportedLang } from './types/lang.types';

export const commandLang: Record<SupportedLang, CommandLanguageFile> = {
    de: deCommandLanguage,
    en: enCommandLanguage,
};


export function getCommandLangKey(interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction, key: CommandLangKey): string {
    const locale = interaction.locale in commandLang ? interaction.locale as SupportedLang : 'en';
    return commandLang[locale][key];
}

export function getCommandLang(langKey: CommandLangKey): Record<SupportedLang, string> {
    const langDict = Object.keys(commandLang).filter((key) => key !== 'en').reduce<Partial<Record<SupportedLang, string>>>((dict, key) => ({
        [key]: commandLang[key as SupportedLang][langKey],
    }), {});
    return langDict as Record<SupportedLang, string>;
}

export function getDefaultCommandLang(langKey: CommandLangKey): string {
    return commandLang.en[langKey];
}