import type { Request } from 'express';
import { LanguageDictAT } from '../languageFiles/at';
import { LanguageDictDE } from '../languageFiles/de';
import { LanguageDictEN } from '../languageFiles/en';
import type { IResponseMessages } from '../interfaces/response-messages';

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

export function getResponseMessage(req: Request, key: keyof IResponseMessages) {
    const foundLangCode = req.acceptsLanguages().find((langCode): langCode is ESupportedLanguages => langCode in ResponseMessageDict);
    const currentDict = ResponseMessageDict[foundLangCode ?? defaultLangCode];
    return currentDict[key];
}