export enum ErrorTypes {
    DEFAULT_ERROR = 'Something went wrong :(',
    AUTH_FAILED = 'You are not Authenticated',
    CHANNEL_ID_NOT_FOUND = 'Channel id not found',
    CHANNEL_JOIN_FAILED = 'Could not join channel',
    CHANNEL_NOT_VOICE = 'Provided channel ist not a voice channel',
    CONNECTION_NOT_FOUND = 'No connection found',
    FILE_NOT_FOUND = 'File not found',
    LOGIN_FAILED = 'Login failed',
    PLAY_DISPATCHER_NOT_FOUND = 'Dispatcher not found',
    PLAY_NOT_ALLOWED = 'Play is not allowed at the moment',
    SERVER_ID_NOT_FOUND = 'Server id not found',
    USER_NOT_IN_VOICE_CHANNEL = 'The user is not in a voice channel',
    SOUND_NOT_FOUND = 'Sound id not found',
    SOUND_COULD_NOT_BE_DELETED = 'Sound could not be deleted',
    TOKEN_NOT_FOUND = 'User token could not be found'
}
