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
    [CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE]: 'Bist zbled um a Audiodatei auszuwöhln oda wos?',
    [CommandLangKey.ERRORS_INSUFFICIENT_PERMISSIONS]: 'Du host kane Rechte!',
    [CommandLangKey.ERRORS_NO_STEAM_URL]: 'I sig do kan Steam Link!',
    [CommandLangKey.ERRORS_INVALID_DATA]: 'Ungültige Angabe!',
    [CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL]: 'Du bist nicht in einem Sprachkanal!',
    [CommandLangKey.ERRORS_FILE_NOT_FOUND]: 'De Datei gibts nit du Volltrottl!',
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
