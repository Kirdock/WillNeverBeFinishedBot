import { createLogger, format, Logger as lg, transports } from 'winston';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';

export class Logger {
    private logger: lg;

    constructor(logLevel: string) {
        this.logger = createLogger({
            transports: [
                new transports.Console({
                    level: logLevel,
                    timestamp: true,
                    prettyPrint: true,
                    format: format.combine(format.json(), format.prettyPrint())
                } as ConsoleTransportOptions),
                new transports.File({
                    level: logLevel,
                    filename: 'Log.log'
                }),
            ],
            exitOnError: false
        });
    }

    public debug(message: string, context?: string | object): void {
        this.logger.debug(message, {
            ...(context && {context})
        });
    }

    public info(message: string, context?: string | object): void {
        this.logger.info(message, {
            ...(context && {context})
        });
    }

    public warn(message: string, context?: string | object): void {
        this.logger.warn(message, {
            ...(context && {context})
        });
    }

    public error(context: Error | string, msg: any): void {
        const message = typeof context === 'string' ? context : context.stack;
        this.logger.error(msg, {meta: {context: message}});
    }
}