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

    //region CHAT_GPT
    [CommandLangKey.CHAT_GPT_NAME]: 'chat_gpt',
    [CommandLangKey.CHAT_GPT_DESCRIPTION]: 'Ask ChatGPT',
    [CommandLangKey.CHAT_GPT_TEXT_NAME]: 'question',
    [CommandLangKey.CHAT_GPT_TEXT_DESCRIPTION]: 'What do you want to know?',
    //endregion

    //region DELETE_COMMAND
    [CommandLangKey.DELETE_COMMAND_NAME]: 'delete_command',
    [CommandLangKey.DELETE_COMMAND_DESCRIPTION]: 'Deletes a registered slash or context menu command',
    //endregion

    //region DELETE_INTRO
    [CommandLangKey.DELETE_INTRO_NAME]: 'remove_intro',
    [CommandLangKey.DELETE_INTRO_DESCRIPTION]: 'Removes your intro. The file will still be here',
    //endregion

    //region DELETE_SOUND
    [CommandLangKey.DELETE_SOUND_NAME]: 'delete_sound',
    [CommandLangKey.DELETE_SOUND_DESCRIPTION]: 'Deletes the given sound',
    //endregion

    //region DELETE_USER_INTRO
    [CommandLangKey.DELETE_USER_INTRO_NAME]: 'remove_user_intro',
    [CommandLangKey.DELETE_USER_INTRO_DESCRIPTION]: 'Removes the intro of the given user',
    //endregion

    //region DOWNLOAD
    [CommandLangKey.DOWNLOAD_NAME]: 'download_sound',
    [CommandLangKey.DOWNLOAD_DESCRIPTION]: 'Uploads the given sound to the Discord channel (only visible to you)',
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
    [CommandLangKey.PLAY_VOLUME_NAME]: 'volume',
    [CommandLangKey.PLAY_VOLUME_DESCRIPTION]: 'Sets the volume for the played sound (1-100%)',
    //endregion

    //region PLAY_FORCE
    [CommandLangKey.PLAY_FORCE_NAME]: 'play_force',
    [CommandLangKey.PLAY_FORCE_DESCRIPTION]: 'Plays a given file that can\'t be interrupted by non admin users',
    //endregion

    //region PLAY_YOUTUBE
    [CommandLangKey.PLAY_YOUTUBE_NAME]: 'play_youtube',
    [CommandLangKey.PLAY_YOUTUBE_DESCRIPTION]: 'Play the audio of a given Youtube-URL',
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

    //region REGISTER_COMMAND_NAME
    [CommandLangKey.REGISTER_COMMAND_NAME]: 'register_command',
    [CommandLangKey.REGISTER_COMMAND_DESCRIPTION]: 'Deletes a given slash or context menu command',
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

    //region SET_INTRO
    [CommandLangKey.SET_INTRO_NAME]: 'set_intro',
    [CommandLangKey.SET_INTRO_DESCRIPTION]: 'Sets the intro that is played when you join a voice channel',
    //endregion

    //region SET_USER_INTRO
    [CommandLangKey.SET_USER_INTRO_NAME]: 'set_user_intro',
    [CommandLangKey.SET_USER_INTRO_DESCRIPTION]: 'Sets the intro of another user',
    [CommandLangKey.SET_USER_INTRO_USER_NAME]: 'user',
    [CommandLangKey.SET_USER_INTRO_USER_DESCRIPTION]: 'Choose a user',
    //endregion

    //region SET_USER_VOLUME
    [CommandLangKey.SET_USER_VOLUME_NAME]: 'set_user_volume',
    [CommandLangKey.SET_USER_VOLUME_DESCRIPTION]: 'Sets the record volume of the given user',
    //endregion

    //region SETTINGS
    [CommandLangKey.SETTINGS_NAME]: 'settings',
    [CommandLangKey.SETTINGS_DESCRIPTION]: 'Bot settings',
    [CommandLangKey.SETTINGS_INTRO_NAME]: 'intro',
    [CommandLangKey.SETTINGS_INTRO_DESCRIPTION]: 'Intro updates (set/delete)',
    [CommandLangKey.SETTINGS_INTRO_SET_NAME]: 'set',
    [CommandLangKey.SETTINGS_INTRO_SET_DESCRIPTION]: 'Sets the default server intro',
    [CommandLangKey.SETTINGS_INTRO_REMOVE_NAME]: 'remove',
    [CommandLangKey.SETTINGS_INTRO_REMOVE_DESCRIPTION]: 'Removes the default server intro',
    [CommandLangKey.SETTINGS_OUTRO_NAME]: 'outro',
    [CommandLangKey.SETTINGS_OUTRO_DESCRIPTION]: 'Outro updates (set/delete)',
    [CommandLangKey.SETTINGS_OUTRO_SET_NAME]: 'set',
    [CommandLangKey.SETTINGS_OUTRO_SET_DESCRIPTION]: 'Sets the default server outro',
    [CommandLangKey.SETTINGS_OUTRO_REMOVE_NAME]: 'remove',
    [CommandLangKey.SETTINGS_OUTRO_REMOVE_DESCRIPTION]: 'Removes the default server outro',
    [CommandLangKey.SETTINGS_CHECKS_NAME]: 'checks',
    [CommandLangKey.SETTINGS_CHECKS_DESCRIPTION]: 'Returns all server settings',
    [CommandLangKey.SETTINGS_LOG_VOICE_NAME]: 'log_voice',
    [CommandLangKey.SETTINGS_LOG_VOICE_DESCRIPTION]: 'Logs voice state updates in a channel',
    [CommandLangKey.SETTINGS_LOG_VOICE_SET_NAME]: 'set',
    [CommandLangKey.SETTINGS_LOG_VOICE_SET_DESCRIPTION]: 'Sets the text channel the logs should be send to',
    [CommandLangKey.SETTINGS_LOG_VOICE_REMOVE_NAME]: 'remove',
    [CommandLangKey.SETTINGS_LOG_VOICE_REMOVE_DESCRIPTION]: 'Disables voice state logging',
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

    //region COMPONENTS
    [CommandLangKey.CHANNEL_NAME]: 'channel',
    [CommandLangKey.CHANNEL_DESCRIPTION]: 'Choose a text-channel',

    [CommandLangKey.COMMAND_SELECTION_NAME]: 'command_name',
    [CommandLangKey.COMMAND_SELECTION_DESCRIPTION]: 'Select the slash or context menu command',
    //endregion

    //endregion

    //region error messages
    [CommandLangKey.ERRORS_INVALID_COMMAND]: 'The command does not exist!',
    [CommandLangKey.ERRORS_INVALID_GUILD]: 'Invalid guild id!',
    [CommandLangKey.ERRORS_INVALID_MEMBER]: 'Invalid member id!',
    [CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE]: 'Invalid file format!',
    [CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
    [CommandLangKey.ERRORS_NO_STEAM_URL]: 'Invalid Steam link provided',
    [CommandLangKey.ERRORS_INVALID_DATA]: 'Invalid data!',
    [CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL]: 'Your are not in a voice channel!',
    [CommandLangKey.ERRORS_FILE_NOT_FOUND]: 'File not found!',
    [CommandLangKey.ERRORS_UNKNOWN]: 'Unknown error happened!',
    [CommandLangKey.ERRORS_OPEN_AI_DISABLED]: 'ChatGPT is disabled by the bot owner',
    [CommandLangKey.ERRORS_EMPTY_RESPONSE]: 'I didn\'t get any response',
    [CommandLangKey.ERRORS_INVALID_TEXT_CHANNEL]: 'Given channel is not a text-channel!',
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