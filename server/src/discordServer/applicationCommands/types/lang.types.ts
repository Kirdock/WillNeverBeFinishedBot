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

    //region DELETE_INTRO
    DELETE_INTRO_NAME,
    DELETE_INTRO_DESCRIPTION,
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

    //region SET_INTRO
    SET_INTRO_NAME,
    SET_INTRO_DESCRIPTION,
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

    //endregion

    //region error messages
    ERRORS_INVALID_GUILD,
    ERRORS_INVALID_MEMBER,
    ERRORS_INVALID_AUDIO_CONTENT_TYPE,
    ERRORS_INSUFFICIENT_PERMISSIONS,
    ERRORS_NO_STEAM_URL,
    ERRORS_INVALID_DATA,
    ERRORS_NOT_IN_VOICE_CHANNEL,
    ERRORS_FILE_NOT_FOUND,
    ERRORS_UNKNOWN,
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
