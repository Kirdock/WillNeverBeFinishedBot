import type { CommandLanguageFile } from '../types/lang.types';
import { CommandLangKey } from '../types/lang.types';

export const deCommandLanguage: Partial<CommandLanguageFile> = {
    //region commands

    //region BUBBLE
    // [CommandLangKey.BUBBLE_NAME]: 'luftpolsterfolie',
    [CommandLangKey.BUBBLE_DESCRIPTION]: 'Generiert eine Luftpolsterfolie',
    [CommandLangKey.BUBBLE_ROW_NAME]: 'zeilen',
    [CommandLangKey.BUBBLE_ROW_DESCRIPTION]: 'Wieviele Zeilen soll die Luftpolsterfolie haben?',
    [CommandLangKey.BUBBLE_COLUMN_NAME]: 'spalten',
    [CommandLangKey.BUBBLE_COLUMN_DESCRIPTION]: 'Wieviele Spalten soll die Luftpolsterfolie haben?',
    //endregion

    //region CHAT_GPT
    // [CommandLangKey.CHAT_GPT_NAME]: 'chat_gpt',
    [CommandLangKey.CHAT_GPT_DESCRIPTION]: 'Frage ChatGPT etwas',
    [CommandLangKey.CHAT_GPT_TEXT_NAME]: 'frage',
    [CommandLangKey.CHAT_GPT_TEXT_DESCRIPTION]: 'Was willst du wissen?',
    //endregion

    //region DELETE_INTRO
    // [CommandLangKey.DELETE_INTRO_NAME]: 'delete_intro',
    [CommandLangKey.DELETE_INTRO_DESCRIPTION]: 'Entfernt dein Intro. Die Audiodatei bleibt erhalten',
    //endregion

    //region DELETE_SOUND
    // [CommandLangKey.DELETE_SOUND_NAME]: 'delete_sound',
    [CommandLangKey.DELETE_SOUND_DESCRIPTION]: 'Löscht die angegebene Audiodatei',
    //endregion

    //region DELETE_USER_INTRO
    // [CommandLangKey.DELETE_USER_INTRO_NAME]: 'remove_user_intro',
    [CommandLangKey.DELETE_USER_INTRO_DESCRIPTION]: 'Entfernt das Intro des angegebenen Benutzers',
    //endregion

    //region DOWNLOAD
    // [CommandLangKey.DOWNLOAD_NAME]: 'download_sound',
    [CommandLangKey.DOWNLOAD_DESCRIPTION]: 'Lädt die Audiodatei in Discord hoch damit du sie herunterladen kannst (nur sichtbar für dich)',
    //endregion

    //region FLIP
    // [CommandLangKey.FLIP_NAME]: 'münzwurf',
    [CommandLangKey.FLIP_DESCRIPTION]: 'Wirf eine Münze',
    [CommandLangKey.FLIP_CHOICE_HEAD]: 'Kopf',
    [CommandLangKey.FLIP_CHOICE_TAILS]: 'Zahl',
    //endregion

    //region GENERATE_STEAM_LINK
    [CommandLangKey.GENERATE_STEAM_LINK_NAME]: 'In Steam öffnen',
    //endregion

    //region JOIN
    // [CommandLangKey.JOIN_NAME]: 'beitreten',
    [CommandLangKey.JOIN_DESCRIPTION]: 'Tritt dem Sprachkanal bei, wo du drinnen bist',
    //endregion

    //region LEAVE
    // [CommandLangKey.LEAVE_NAME]: 'verlassen',
    [CommandLangKey.LEAVE_DESCRIPTION]: 'Bot verpisst sich vom Sprachkanal',
    //endregion

    //region LIST
    // [CommandLangKey.LIST_NAME]: 'webseite',
    [CommandLangKey.LIST_DESCRIPTION]: 'Gibt dir die Webseite des Bots',
    //endregion

    //region PICK
    // [CommandLangKey.PICK_NAME]: 'entscheide',
    [CommandLangKey.PICK_DESCRIPTION]: 'Wählt zufällig eine Bezeichnung aus einer gegebenen Auswahl',
    [CommandLangKey.PICK_CHOICE_NAME]: 'bezeichnungen',
    [CommandLangKey.PICK_CHOICE_DESCRIPTION]: 'Trenne deine eingegebenen Bezeichnungen mit Beistrich ","',
    //endregion

    //region PLAY
    // [CommandLangKey.PLAY_NAME]: 'abspielen',
    [CommandLangKey.PLAY_DESCRIPTION]: 'Spiele eine Audiodatei in Sprachkanal ab',
    [CommandLangKey.PLAY_FILE_NAME]: 'datei',
    [CommandLangKey.PLAY_FILE_DESCRIPTION]: 'Wähle einen Song aus, den du abspielen möchtest',
    [CommandLangKey.PLAY_VOLUME_NAME]: 'lautstärke',
    [CommandLangKey.PLAY_VOLUME_DESCRIPTION]: 'Setzt die Lautstärke der abzuspielenden Audiodatei +(1-100%)',
    //endregion

    //region PLAY_FORCE
    // [CommandLangKey.PLAY_FORCE_NAME]: 'play_force',
    [CommandLangKey.PLAY_FORCE_DESCRIPTION]: 'Spielt eine Audiodatei ab, die nur von Admins abgebrochen werden kann',
    //endregion

    //region PLAY_YOUTUBE
    // [CommandLangKey.PLAY_YOUTUBE_NAME]: 'play_youtube',
    [CommandLangKey.PLAY_YOUTUBE_DESCRIPTION]: 'Spiele den Ton eines Youtube Videos ab',
    //endregion

    //region POST_STEAM_LINK
    // [CommandLangKey.POST_STEAM_LINK_NAME]: 'steam_link_posten',
    [CommandLangKey.POST_STEAM_LINK_DESCRIPTION]: 'Postet einen Steam-Link so, damit er in der Anwendung anstatt im Browser aufgemacht wird',
    [CommandLangKey.POST_STEAM_LINK_URL_NAME]: 'url',
    [CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION]: 'Steam Link',
    //endregion

    //region QUESTION
    // [CommandLangKey.QUESTION_NAME]: 'frag_mich',
    [CommandLangKey.QUESTION_DESCRIPTION]: 'Frag etwas und bekomme eine Antwort',
    [CommandLangKey.QUESTION_QUESTION_NAME]: 'frage',
    [CommandLangKey.QUESTION_QUESTION_DESCRIPTION]: 'Gib deine Frage ein',
    [CommandLangKey.QUESTION_CHOICE_YES]: 'Ja',
    [CommandLangKey.QUESTION_CHOICE_NO]: 'Nein',
    [CommandLangKey.QUESTION_CHOICE_ASK_AGAIN]: 'Frag doch einfach nochmal',
    //endregion

    //region RE_REGISTER
    // [CommandLangKey.RE_REGISTER_NAME]: 'neu_registrieren',
    [CommandLangKey.RE_REGISTER_DESCRIPTION]: 'Löscht alle Kommandos und registriert sie erneut',
    //endregion

    //region SAVE_RECORDING
    // [CommandLangKey.SAVE_RECORDING_NAME]: 'speichern',
    [CommandLangKey.SAVE_RECORDING_DESCRIPTION]: 'Speichere die letzten (bis zu 10) Minuten',
    [CommandLangKey.SAVE_RECORDING_MINUTES_NAME]: 'minuten',
    [CommandLangKey.SAVE_RECORDING_MINUTES_DESCRIPTION]: 'Wieviele Minuten sollen gespeichert werden?',
    [CommandLangKey.SAVE_RECORDING_TYPE_NAME]: 'typ',
    [CommandLangKey.SAVE_RECORDING_TYPE_DESCRIPTION]: 'Eine Datei oder als ZIP mit allen Benutzeraufnahmen',
    [CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_SINGLE]: 'Eine Datei',
    [CommandLangKey.SAVE_RECORDING_TYPE_CHOICE_MULTIPLE]: 'ZIP Datei mit allen Benutzeraufnahmen',
    //endregion

    //region SET_INTRO
    // [CommandLangKey.SET_INTRO_NAME]: 'set_intro',
    [CommandLangKey.SET_INTRO_DESCRIPTION]: 'Setzt das Intro, das abgespielt wird, wenn du einem Sprachkanal beitrittst',
    //endregion

    //region SET_USER_INTRO
    // [CommandLangKey.SET_USER_INTRO_NAME]: 'set_user_intro',
    [CommandLangKey.SET_USER_INTRO_DESCRIPTION]: 'Setzt das Intro eines anderen Benutzers',
    [CommandLangKey.SET_USER_INTRO_USER_NAME]: 'benutzer',
    [CommandLangKey.SET_USER_INTRO_USER_DESCRIPTION]: 'Wähle einen Benutzer',
    //endregion

    //region SET_USER_VOLUME
    // [CommandLangKey.SET_USER_VOLUME_NAME]: 'set_user_volume',
    [CommandLangKey.SET_USER_VOLUME_DESCRIPTION]: 'Setzt die Aufnahmelautstärke des ausgewählten Nutzers',
    //endregion

    //region STOP
    // [CommandLangKey.STOP_NAME]: 'stop',
    [CommandLangKey.STOP_DESCRIPTION]: 'Sorgt dafia, dass da Bot sei Goschn holtat',
    //endregion

    //region UNREGISTER
    // [CommandLangKey.UNREGISTER_NAME]: 'kommandos_löschen',
    [CommandLangKey.UNREGISTER_DESCRIPTION]: 'Lösche alle registrierten Befehle',
    //endregion

    //region UPLOAD_FILE
    // [CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME]: 'hochladen',
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
    [CommandLangKey.ERRORS_INVALID_MEMBER]: 'Ungültige Benutzer ID!',
    [CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE]: 'Bist zbled um a Audiodatei auszuwöhln oda wos?',
    [CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS]: 'Du host kane Rechte!',
    [CommandLangKey.ERRORS_NO_STEAM_URL]: 'I sig do kan Steam Link!',
    [CommandLangKey.ERRORS_INVALID_DATA]: 'Ungültige Angabe!',
    [CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL]: 'Du bist nicht in einem Sprachkanal!',
    [CommandLangKey.ERRORS_FILE_NOT_FOUND]: 'De Datei gibts nit du Volltrottl!',
    [CommandLangKey.ERRORS_OPEN_AI_DISABLED]: 'ChatGPT ist vom Botbesicher deaktiviert worden',
    [CommandLangKey.ERRORS_EMPTY_RESPONSE]: 'Keine Antwort erhalten',
    //endregion

    //region success messages
    [CommandLangKey.SUCCESS_UPLOAD]: 'Hochgeladen!',
    [CommandLangKey.SUCCESS]: 'Erledigt!',
    //endregion

    //region etc.
    [CommandLangKey.LOADING]: 'Laden...',
    [CommandLangKey.TRYING_MY_BEST]: 'Ich versuch mein bestes',
    //endregion
};
