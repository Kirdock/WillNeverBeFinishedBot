export enum CommandLangKey {
    //region Commands

    //region UPLOAD_FILE
    UPLOAD_FILE_BASE_COMMAND_NAME,
    UPLOAD_FILE_BASE_COMMAND_DESCRIPTION,
    UPLOAD_FILE_ATTACHMENT_NAME,
    UPLOAD_FILE_ATTACHMENT_DESCRIPTION,
    UPLOAD_FILE_FILE_NAME_NAME,
    UPLOAD_FILE_FILE_NAME_DESCRIPTION,
    UPLOAD_FILE_CATEGORY_NAME,
    UPLOAD_FILE_CATEGORY_DESCRIPTION,
    //endregion

    //endregion

    //region error messages
    ERRORS_INVALID_GUILD,
    ERRORS_INVALID_AUDIO_CONTENT_TYPE,
    //endregion

    //region Success messages
    SUCCESS_UPLOAD
    //endregion
}

export type SupportedLang = 'de' | 'en';


export type CommandLanguageFile = Record<CommandLangKey, string>;