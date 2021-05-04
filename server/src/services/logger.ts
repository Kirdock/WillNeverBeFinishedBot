import { createLogger, transports, Logger as lg } from "winston";
import { ConsoleTransportOptions } from "winston/lib/winston/transports";

export default class Logger {
    private logger: lg;
    constructor(){
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

    debug(context: any, message: string){
        this.logger.debug(message, {context});
    }
    info(context: any, message: string){
        this.logger.info(message, {context});
    }
    warn(context: any, message: string){
        this.logger.warn(message, {context});
    }

    error(context: Error | string, msg: any){
        const message = typeof context === 'string' ? context : context.stack;
        this.logger.error(msg, {meta:{context: message}});
    }
}