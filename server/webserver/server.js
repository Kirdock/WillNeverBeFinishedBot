'use strict';
const express = require('express');
const app = express();
const body_parser = require('body-parser');
const history = require('connect-history-api-fallback');
const https = require('https');
const fs = require('fs');

module.exports = (discordClient, config, logger)=> {
    const port = process.env.PORT || config.port;
    const isLocal = process.env.local;
    const staticFileMiddleware = express.static(__dirname+'/../../dist');
    const router = express.Router();
    const cors = function (req, res, next) {
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
    app.use(staticFileMiddleware);
    app.use(history());
    app.use(staticFileMiddleware);
    
    require('./routes.js')(router, logger, discordClient, config);
    app.use('/api',router);

    if(isLocal){
        app.listen(port);
    }
    else{
        app.use(function(req, res, next) {
            const host = req.get('Host');
            if((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
                res.redirect(`https://${host}${req.url}`);
            }
            else{
                next();
            }
        });

        https.createServer({
            key: fs.readFileSync(__dirname+'/cert/privkey.pem'),
            cert: fs.readFileSync(__dirname+'/cert/cert.pem')
        }, app)
        .listen(port);
    }
    
};