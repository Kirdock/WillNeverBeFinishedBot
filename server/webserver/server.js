'use strict';
const express = require('express');
const app = express();
const body_parser = require('body-parser');
const history = require('connect-history-api-fallback');


module.exports = (discordClient, config, logger)=> {

    var cors = function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

        // intercept OPTIONS method
        if ('OPTIONS' == req.method) {
            res.send(200);
        }
        else {
            next();
        }
    };
    app.use(cors);
    app.use(body_parser.json({limit: '20mb'}));
    const staticFileMiddleware = express.static(__dirname+'/../../dist');
    app.use(staticFileMiddleware);
    app.use(history());
    app.use(staticFileMiddleware);


    var port = process.env.PORT || config.port;
    var router = express.Router();

    require('./routes.js')(router, logger, discordClient, config);
    app.use('/api',router);
    app.listen(port);
};