'use strict';

module.exports = ( config, root_folder ) => {
    var winston = require('winston');

    var options = {
        level: 'warn'
    };
    var logger = winston.createLogger({
        level: options.level,
        transports: [
            new winston.transports.Console({
                handleExceptions: true,
                prettyPrint: true,
                colorize: true
            }),
            new winston.transports.File({
                handleExceptions: true,
                prettyPrint: true,
                colorize: true,
                filename: 'Logs.log'
            })
        ],
        exitOnError: false
    });

    function debug(context, msg){
        if (logger){
            logger.debug(msg, context);
        }
    }
    function info(context, msg){
        if (logger){
            logger.info(msg, context);
        }
    }
    function warn(context, msg){
        if (logger){
            logger.warn(msg,context);
        }
    }
    function error(context, msg){
        if (logger){
            logger.error(msg, context);
        }
    }

    return {
        debug: debug,
        info: info,
        warn: warn,
        error: error
    };

};