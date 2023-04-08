enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Tail<T extends unknown[]> = T extends [infer Head, ...infer Tail] ? Tail : never;

type LogScopes = 'SERVER' | 'BOT' | 'VOICE' | 'AUTH' | 'FILE_SYSTEM' | 'MIGRATOR' | 'PLAY_SOUND' | 'CONFIG' | 'API' | 'APPLICATION_COMMANDS' | 'ON_MESSAGE_CREATE';
export type LogFunction = (scope: LogScopes, message: unknown, additionalInfo?: unknown) => void;
export type LogKeys = 'debug' | 'info' | 'warn' | 'error';
type LoggerMethods = {[key in LogKeys]: LogFunction};
type ScopedLogger = {[key in LogKeys]: (...params: Tail<Parameters<LogFunction>>) => ReturnType<LogFunction>};

const logKeys = Object.keys(LogLevel);

export const defaultLogLevel = LogLevel.DEBUG;
const inputLogLevel = process.env.LOG_LEVEL?.toUpperCase();
export const logLevel = LogLevel[isValidValue(inputLogLevel) ? inputLogLevel : 'DEBUG'];

const Logger: LoggerMethods = {
    debug(scope, message, additionalInfo) {
        if (logLevel <= LogLevel.DEBUG) {
            console.debug(formatLog(LogLevel.DEBUG, scope, message, additionalInfo));
        }
    },
    info(scope, message, additionalInfo) {
        if (logLevel <= LogLevel.INFO) {
            console.info(formatLog(LogLevel.INFO, scope, message, additionalInfo));
        }
    },
    warn(scope, message, additionalInfo) {
        if (logLevel <= LogLevel.WARN) {
            console.warn(formatLog(LogLevel.WARN, scope, message, additionalInfo));
        }
    },
    error(scope, message, additionalInfo) {
        if (logLevel <= LogLevel.ERROR) {
            console.error(formatLog(LogLevel.ERROR, scope, message, additionalInfo));
        }
    }
}

function isValidValue(level?: string): level is keyof typeof LogLevel {
    return !!level && logKeys.includes(level);
}

function formatLog(level: LogLevel, scope: string, message: unknown, additionalInfo: unknown) {
    const info = stringify(additionalInfo);
    const infoText = info ? `info: ${info}` : '';

    return `[${LogLevel[level].toUpperCase()} - ${scope}]: ${stringify(message)}${infoText}`;
}

function stringify(message: unknown) {
    if (message instanceof Error) {
        return message.stack ?? message.message;
    }

    return JSON.stringify(message);
}

export function scopedLogger(scope: LogScopes): ScopedLogger {
    return Object.keys(Logger).reduce<Partial<ScopedLogger>>((logger, key)=> {
        logger[key as LogKeys] = (...params: Tail<Parameters<LogFunction>>) => Logger[key as LogKeys](scope, ...params)
        return logger;
    }, {}) as ScopedLogger;
}