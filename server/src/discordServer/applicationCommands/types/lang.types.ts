export enum CommandLangKey {
    //region Commands

    //region BUBBLE
    BUBBLE_NAME,
    BUBBLE_DESCRIPTION,
    BUBBLE_ROW_NAME,
    BUBBLE_ROW_DESCRIPTION,
    BUBBLE_COLUMN_NAME,
    BUBBLE_COLUMN_DESCRIPTION,
    //endregion

    //region CHAT_GPT
    CHAT_GPT_NAME,
    CHAT_GPT_DESCRIPTION,
    CHAT_GPT_TEXT_NAME,
    CHAT_GPT_TEXT_DESCRIPTION,
    //endregion

    //region COMMAND
    COMMAND_NAME,
    COMMAND_DESCRIPTION,
    COMMAND_REGISTER_NAME,
    COMMAND_REGISTER_DESCRIPTION,
    COMMAND_REMOVE_NAME,
    COMMAND_REMOVE_DESCRIPTION,
    //endregion

    //region DELETE_SOUND
    DELETE_SOUND_NAME,
    DELETE_SOUND_DESCRIPTION,
    //endregion

    //region DELETE_USER_INTRO
    DELETE_USER_INTRO_NAME,
    DELETE_USER_INTRO_DESCRIPTION,
    //endregion

    //region DOWNLOAD
    DOWNLOAD_NAME,
    DOWNLOAD_DESCRIPTION,
    //endregion

    //region FLIP
    FLIP_NAME,
    FLIP_DESCRIPTION,
    FLIP_CHOICE_HEAD,
    FLIP_CHOICE_TAILS,
    //endregion

    //region GENERATE_STEAM_LINK
    GENERATE_STEAM_LINK_NAME,
    //endregion

    //region INTRO
    INTRO_NAME,
    INTRO_DESCRIPTION,
    INTRO_SET_NAME,
    INTRO_SET_DESCRIPTION,
    INTRO_REMOVE_NAME,
    INTRO_REMOVE_DESCRIPTION,
    //endregion

    //region JOIN
    JOIN_NAME,
    JOIN_DESCRIPTION,
    //endregion

    //region LEAVE
    LEAVE_NAME,
    LEAVE_DESCRIPTION,
    //endregion

    //region LIST
    LIST_NAME,
    LIST_DESCRIPTION,
    //endregion

    //region PICK
    PICK_NAME,
    PICK_DESCRIPTION,
    PICK_CHOICE_NAME,
    PICK_CHOICE_DESCRIPTION,
    //endregion

    //region PLAY
    PLAY_NAME,
    PLAY_DESCRIPTION,
    PLAY_FILE_NAME,
    PLAY_FILE_DESCRIPTION,
    PLAY_VOLUME_NAME,
    PLAY_VOLUME_DESCRIPTION,
    //endregion

    //region PLAY_FORCE
    PLAY_FORCE_NAME,
    PLAY_FORCE_DESCRIPTION,
    //endregion

    //region PLAY_YOUTUBE
    PLAY_YOUTUBE_NAME,
    PLAY_YOUTUBE_DESCRIPTION,
    //endregion

    //region POST_STEAM_LINK
    POST_STEAM_LINK_NAME,
    POST_STEAM_LINK_DESCRIPTION,
    POST_STEAM_LINK_URL_NAME,
    POST_STEAM_LINK_URL_DESCRIPTION,
    //endregion

    //region QUESTION
    QUESTION_NAME,
    QUESTION_DESCRIPTION,
    QUESTION_QUESTION_NAME,
    QUESTION_QUESTION_DESCRIPTION,
    QUESTION_CHOICE_YES,
    QUESTION_CHOICE_NO,
    QUESTION_CHOICE_ASK_AGAIN,
    //endregion

    //region RE_REGISTER
    RE_REGISTER_NAME,
    RE_REGISTER_DESCRIPTION,
    //endregion

    //region SAVE_RECORDING
    SAVE_RECORDING_NAME,
    SAVE_RECORDING_DESCRIPTION,
    SAVE_RECORDING_MINUTES_NAME,
    SAVE_RECORDING_MINUTES_DESCRIPTION,
    SAVE_RECORDING_TYPE_NAME,
    SAVE_RECORDING_TYPE_DESCRIPTION,
    SAVE_RECORDING_TYPE_CHOICE_SINGLE,
    SAVE_RECORDING_TYPE_CHOICE_MULTIPLE,
    //endregion

    //region SET_USER_INTRO
    SET_USER_INTRO_NAME,
    SET_USER_INTRO_DESCRIPTION,
    SET_USER_INTRO_USER_NAME,
    SET_USER_INTRO_USER_DESCRIPTION,
    //endregion

    //region SET_USER_VOLUME
    SET_USER_VOLUME_NAME,
    SET_USER_VOLUME_DESCRIPTION,
    //endregion

    //region SETTINGS
    SETTINGS_NAME,
    SETTINGS_DESCRIPTION,
    SETTINGS_INTRO_NAME,
    SETTINGS_INTRO_DESCRIPTION,
    SETTINGS_INTRO_SET_NAME,
    SETTINGS_INTRO_SET_DESCRIPTION,
    SETTINGS_INTRO_REMOVE_NAME,
    SETTINGS_INTRO_REMOVE_DESCRIPTION,
    SETTINGS_OUTRO_NAME,
    SETTINGS_OUTRO_DESCRIPTION,
    SETTINGS_OUTRO_SET_NAME,
    SETTINGS_OUTRO_SET_DESCRIPTION,
    SETTINGS_OUTRO_REMOVE_NAME,
    SETTINGS_OUTRO_REMOVE_DESCRIPTION,
    SETTINGS_CHECKS_NAME,
    SETTINGS_CHECKS_DESCRIPTION,
    SETTINGS_LOG_VOICE_NAME,
    SETTINGS_LOG_VOICE_DESCRIPTION,
    SETTINGS_LOG_VOICE_SET_NAME,
    SETTINGS_LOG_VOICE_SET_DESCRIPTION,
    SETTINGS_LOG_VOICE_REMOVE_NAME,
    SETTINGS_LOG_VOICE_REMOVE_DESCRIPTION,
    //endregion

    //region STOP
    STOP_NAME,
    STOP_DESCRIPTION,
    //endregion

    //region UNREGISTER_NAME
    UNREGISTER_NAME,
    UNREGISTER_DESCRIPTION,
    //endregion

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

    //region COMPONENTS
    CHANNEL_NAME,
    CHANNEL_DESCRIPTION,

    COMMAND_SELECTION_NAME,
    COMMAND_SELECTION_DESCRIPTION,
    //endregion

    //endregion

    //region error messages
    ERRORS_INVALID_COMMAND,
    ERRORS_INVALID_GUILD,
    ERRORS_INVALID_MEMBER,
    ERRORS_INVALID_AUDIO_CONTENT_TYPE,
    ERRORS_INSUFFICIENT_PERMISSIONS,
    ERRORS_NO_STEAM_URL,
    ERRORS_INVALID_DATA,
    ERRORS_NOT_IN_VOICE_CHANNEL,
    ERRORS_FILE_NOT_FOUND,
    ERRORS_UNKNOWN,
    ERRORS_OPEN_AI_DISABLED,
    ERRORS_EMPTY_RESPONSE,
    ERRORS_INVALID_TEXT_CHANNEL,
    //endregion

    //region Success messages
    SUCCESS_UPLOAD,
    SUCCESS,
    //endregion

    //region etc.
    LOADING,
    TRYING_MY_BEST
    //endregion
}

export type SupportedLang = 'de' | 'en';


export type CommandLanguageFile = Record<CommandLangKey, string>;
