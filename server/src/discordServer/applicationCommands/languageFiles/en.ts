import type { CommandLanguageFile } from '../types/lang.types';
import { CommandLangKey } from '../types/lang.types';

export const enCommandLanguage: CommandLanguageFile = {
    //region commands
    //region UPLOAD_FILE
    [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME]: 'upload',
    [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_DESCRIPTION]: 'Upload a sound file',
    [CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME]: 'file',
    [CommandLangKey.UPLOAD_FILE_ATTACHMENT_DESCRIPTION]: 'Attach you audio file',
    [CommandLangKey.UPLOAD_FILE_CATEGORY_NAME]: 'category',
    [CommandLangKey.UPLOAD_FILE_CATEGORY_DESCRIPTION]: 'Sound category',
    [CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME]: 'file-name',
    [CommandLangKey.UPLOAD_FILE_FILE_NAME_DESCRIPTION]: 'File name (optional)',

    //endregion
    //endregion
    //region error messages
    [CommandLangKey.ERRORS_INVALID_GUILD]: 'Invalid guild id!',
    [CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE]: 'Invalid file format!',
    //endregion
    //region success messages
    [CommandLangKey.SUCCESS_UPLOAD]: 'uploaded!',


};