'use strict';

const express = require('express');
const app = express();

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
    app.use('/', express.static(__dirname + './../client'));

    var port = process.env.PORT || 5000;
    var router = express.Router();

    require('./routes.js')(router, logger, discordClient, config);
    app.use('/api',router);
    app.listen(port);
};