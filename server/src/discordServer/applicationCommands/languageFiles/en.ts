import type { CommandLanguageFile } from '../types/lang.types';
import { CommandLangKey } from '../types/lang.types';

export const enCommandLanguage: CommandLanguageFile = {
    //region commands

    //region BUBBLE
    [CommandLangKey.BUBBLE_NAME]: 'bubble_wrap',
    [CommandLangKey.BUBBLE_DESCRIPTION]: 'Generate a bubble wrap',
    [CommandLangKey.BUBBLE_ROW_NAME]: 'rows',
    [CommandLangKey.BUBBLE_ROW_DESCRIPTION]: 'How many rows your bubble wrap should have',
    [CommandLangKey.BUBBLE_COLUMN_NAME]: 'columns',
    [CommandLangKey.BUBBLE_COLUMN_DESCRIPTION]: 'How many columns your bubble wrap should have',
    //endregion

    //region FLIP
    [CommandLangKey.FLIP_NAME]: 'coin_flip',
    [CommandLangKey.FLIP_DESCRIPTION]: 'Flip a coin',
    [CommandLangKey.FLIP_CHOICE_HEAD]: 'Head',
    [CommandLangKey.FLIP_CHOICE_TAILS]: 'TAILS',
    //endregion

    //region GENERATE_STEAM_LINK
    [CommandLangKey.GENERATE_STEAM_LINK_NAME]: 'Open in Steam',
    //endregion

    //region JOIN
    [CommandLangKey.JOIN_NAME]: 'join',
    [CommandLangKey.JOIN_DESCRIPTION]: 'Joins the voice channel you are in',
    //endregion

    //region LEAVE
    [CommandLangKey.LEAVE_NAME]: 'leave',
    [CommandLangKey.LEAVE_DESCRIPTION]: 'Bot leaves the voice channel',
    //endregion

    //region LIST
    [CommandLangKey.LIST_NAME]: 'website',
    [CommandLangKey.LIST_DESCRIPTION]: 'Prints URL to the website of the bot',
    //endregion

    //region PICK
    [CommandLangKey.PICK_NAME]: 'decide',
    [CommandLangKey.PICK_DESCRIPTION]: 'Picks a random choice you provide',
    [CommandLangKey.PICK_CHOICE_NAME]: 'choices',
    [CommandLangKey.PICK_CHOICE_DESCRIPTION]: 'Separate your choices with a comma ","',
    //endregion

    //region PLAY
    [CommandLangKey.PLAY_NAME]: 'play',
    [CommandLangKey.PLAY_DESCRIPTION]: 'Plays a file in the voice channel you are in',
    [CommandLangKey.PLAY_FILE_NAME]: 'file',
    [CommandLangKey.PLAY_FILE_DESCRIPTION]: 'Choose the file you want to be played',
    //endregion

    //region POST_STEAM_LINK
    [CommandLangKey.POST_STEAM_LINK_NAME]: 'post_steam_link',
    [CommandLangKey.POST_STEAM_LINK_DESCRIPTION]: 'Modifies a given Steam link so that it opens in the Steam client instead',
    [CommandLangKey.POST_STEAM_LINK_URL_NAME]: 'url',
    [CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION]: 'Steam link',
    //endregion

    //region QUESTION
    [CommandLangKey.QUESTION_NAME]: 'question',
    [CommandLangKey.QUESTION_DESCRIPTION]: 'Ask something and get a response',
    [CommandLangKey.QUESTION_QUESTION_NAME]: 'question',
    [CommandLangKey.QUESTION_QUESTION_DESCRIPTION]: 'Enter your question',
    [CommandLangKey.QUESTION_CHOICE_YES]: 'Yes',
    [CommandLangKey.QUESTION_CHOICE_NO]: 'No',
    [CommandLangKey.QUESTION_CHOICE_ASK_AGAIN]: 'Just ask again',
    //endregion

    //region RE_REGISTER
    [CommandLangKey.RE_REGISTER_NAME]: 're_register',
    [CommandLangKey.RE_REGISTER_DESCRIPTION]: 'Command for re-registering slash commands',
    //endregion

    //region SAVE_RECORDING
    [CommandLangKey.SAVE_RECORDING_NAME]: 'save',
    [CommandLangKey.SAVE_RECORDING_DESCRIPTION]: 'Save the last x (up to 10) minutes',
    [CommandLangKey.SAVE_RECORDING_MINUTES_NAME]: 'minutes',
    [CommandLangKey.SAVE_RECORDING_MINUTES_DESCRIPTION]: 'How many minutes should be saved',
    [CommandLangKey.SAVE_RECORDING_TYPE_NAME]: 'type',
    [CommandLangKey.SAVE_RECORDING_TYPE_DESCRIPTION]: 'Save as single file or as zip file with a file per user',
    [CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_SINGLE]: 'Single file',
    [CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_MULTIPLE]: 'ZIP file with all user recordings',
    //endregion

    //region STOP
    [CommandLangKey.STOP_NAME]: 'stop',
    [CommandLangKey.STOP_DESCRIPTION]: 'Stops the bot from playing',
    //endregion

    //region UNREGISTER
    [CommandLangKey.UNREGISTER_NAME]: 'unregister',
    [CommandLangKey.UNREGISTER_DESCRIPTION]: 'Delete all registered commands',
    //endregion

    //region UPLOAD_FILE
    [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME]: 'upload',
    [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_DESCRIPTION]: 'Upload a sound file',
    [CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME]: 'file',
    [CommandLangKey.UPLOAD_FILE_ATTACHMENT_DESCRIPTION]: 'Attach you audio file',
    [CommandLangKey.UPLOAD_FILE_CATEGORY_NAME]: 'category',
    [CommandLangKey.UPLOAD_FILE_CATEGORY_DESCRIPTION]: 'Sound category',
    [CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME]: 'file_name',
    [CommandLangKey.UPLOAD_FILE_FILE_NAME_DESCRIPTION]: 'File name (optional)',

    //endregion

    //endregion

    //region error messages
    [CommandLangKey.ERRORS_INVALID_GUILD]: 'Invalid guild id!',
    [CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE]: 'Invalid file format!',
    [CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
    [CommandLangKey.ERRORS_NO_STEAM_URL]: 'Invalid Steam link provided',
    [CommandLangKey.ERRORS_INVALID_DATA]: 'Invalid data!',
    [CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL]: 'Your are not in a voice channel!',
    [CommandLangKey.ERRORS_FILE_NOT_FOUND]: 'File not found!',
    //endregion

    //region success messages
    [CommandLangKey.SUCCESS_UPLOAD]: 'Uploaded!',
    [CommandLangKey.SUCCESS]: 'Operation successful',
    //endregion

    //region etc.
    [CommandLangKey.LOADING]: 'Loading...',
    [CommandLangKey.TRYING_MY_BEST]: 'I\'m trying my best',
    //endregion
};
