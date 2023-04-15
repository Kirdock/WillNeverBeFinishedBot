import { deCommandLanguage } from './languageFiles/de';
import { enCommandLanguage } from './languageFiles/en';
import type { BaseInteraction, LocaleString } from 'discord.js';
import type { CommandLangKey, CommandLanguageFile, SupportedLang } from './types/lang.types';

export const commandLang: { en: CommandLanguageFile, de: Partial<CommandLanguageFile> } = {
    de: deCommandLanguage,
    en: enCommandLanguage,
};


export function getCommandLangKey(interaction: BaseInteraction | LocaleString, key: CommandLangKey): string {
    const localeKey = typeof interaction === 'string' ? interaction : interaction.locale;
    const locale = localeKey in commandLang ? localeKey as SupportedLang : 'en';
    return commandLang[locale][key] ?? commandLang.en[key];
}

export function getCommandLang(langKey: CommandLangKey): Record<SupportedLang, string> {
    const langDict = Object.keys(commandLang).filter((key) => key !== 'en').reduce<Partial<Record<SupportedLang, string>>>((dict, key) => {
        dict[key as SupportedLang] = commandLang[key as SupportedLang][langKey] ?? commandLang.en[langKey];
        return dict;
    }, {});
    return langDict as Record<SupportedLang, string>;
}

export function getDefaultCommandLang(langKey: CommandLangKey): string {
    return commandLang.en[langKey];
}
