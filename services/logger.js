'use strict';

module.exports = ( config, root_folder ) => {
    const winston = require('winston');
    const logger = winston.createLogger({
        transports: [
            new winston.transports.Console({
                level: 'debug',
                timestamp: true,
                prettyPrint: true
            }),
            new winston.transports.File({
                filename: 'Log.log',
                prettyPrint: true
            }),
        ],
        exitOnError: false
    });
    

    function debug(context, msg){
        if (logger){
            logger.debug(msg, {context});
        }
    }
    function info(context, msg){
        if (logger){
            logger.info(msg, {context});
        }
    }
    function warn(context, msg){
        if (logger){
            logger.warn(msg, {context});
        }
    }
    function error(context, msg){
        if (logger){
            let message = context;
            if(context && context.stack){
                message = context.stack;
            }
            logger.error(msg, {meta:{context: message}});
        }
    }

    return {
        debug: debug,
        info: info,
        warn: warn,
        error: error
    };

};