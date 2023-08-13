import type { Request } from 'express';
import { LanguageDictAT } from '../languageFiles/at';
import { LanguageDictDE } from '../languageFiles/de';
import { LanguageDictEN } from '../languageFiles/en';
import type { IResponseMessages } from '../interfaces/response-messages';
import type { LocaleString } from 'discord.js';

enum ESupportedLanguages {
    AT = 'de-AT',
    DE = 'de',
    EN = 'en',
}

const defaultLangCode = ESupportedLanguages.EN;
const ResponseMessageDict: Record<ESupportedLanguages, IResponseMessages> = {
    [ESupportedLanguages.AT]: LanguageDictAT,
    [ESupportedLanguages.DE]: LanguageDictDE,
    [ESupportedLanguages.EN]: LanguageDictEN,
};

export function getRequestLocale(req: Request): ESupportedLanguages {
    return req.acceptsLanguages().find((langCode): langCode is ESupportedLanguages => langCode in ResponseMessageDict) ?? defaultLangCode;
}

export function getRequestBaseLocale(req: Request): LocaleString {
    return getRequestLocale(req).split('-')[0] as LocaleString;
}

export function getResponseMessage(req: Request, key: keyof IResponseMessages) {
    const foundLangCode = getRequestLocale(req);
    const currentDict = ResponseMessageDict[foundLangCode];
    return currentDict[key];
}
