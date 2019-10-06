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
                prettyPrint: true,
                colorize: true
            })
        ],
        exitOnError: false
    });

    function debug(context, msg){
        if (logger){
            logger.debug(msg, { meta: { context: context } });
        }
    }
    function info(context, msg){
        if (logger){
            logger.info(msg, { meta: { context: context } });
        }
    }
    function warn(context, msg){
        if (logger){
            logger.warn(msg, { meta: { context: context } });
        }
    }
    function error(context, msg){
        if (logger){
            logger.error(msg, { meta: { context: context } });
        }
    }

    return {
        debug: debug,
        info: info,
        warn: warn,
        error: error
    };

};