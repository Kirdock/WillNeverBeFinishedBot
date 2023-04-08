import type { CommandLanguageFile } from '../types/lang.types';
import { CommandLangKey } from '../types/lang.types';

export const deCommandLanguage: CommandLanguageFile = {
    //region commands

    //region UPLOAD_FILE
    [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME]: 'hochladen',
    [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_DESCRIPTION]: 'Lade eine Audiodatei hoch',
    [CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME]: 'datei',
    [CommandLangKey.UPLOAD_FILE_ATTACHMENT_DESCRIPTION]: 'Hänge deine Audiodatei an',
    [CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME]: 'dateiname',
    [CommandLangKey.UPLOAD_FILE_FILE_NAME_DESCRIPTION]: 'Dateiname (optional)',
    [CommandLangKey.UPLOAD_FILE_CATEGORY_NAME]: 'kategorie',
    [CommandLangKey.UPLOAD_FILE_CATEGORY_DESCRIPTION]: 'Sound Kategorie',

    //endregion
    //endregion

    //region error messages
    [CommandLangKey.ERRORS_INVALID_GUILD]: 'Ungültige Server ID!',
    [CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE]: 'Bist zbled um a Audiodatei auszuwöhln oda wos?',
    //endregion

    //region success messages
    [CommandLangKey.SUCCESS_UPLOAD]: 'Hochgeladen!',
    //endregion
};
