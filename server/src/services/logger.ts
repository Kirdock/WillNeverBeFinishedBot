import { createLogger, transports, Logger as lg } from "winston";
import { ConsoleTransportOptions } from "winston/lib/winston/transports";

export default class Logger {
    private logger: lg;
    constructor() {
        this.logger = createLogger({
            transports: [
                new transports.Console({
                    level: 'debug',
                    timestamp: true,
                    prettyPrint: true
                } as ConsoleTransportOptions),
                new transports.File({
                    filename: 'Log.log'
                }),
            ],
            exitOnError: false
        });
    }

    public debug(context: any, message: string): void {
        this.logger.debug(message, { context });
    }
    public info(context: any, message: string): void {
        this.logger.info(message, { context });
    }
    public warn(context: any, message: string): void {
        this.logger.warn(message, { context });
    }

    public error(context: Error | string, msg: any): void {
        const message = typeof context === 'string' ? context : context.stack;
        this.logger.error(msg, { meta: { context: message } });
    }
}