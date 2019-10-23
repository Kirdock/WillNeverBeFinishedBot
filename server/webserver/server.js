'use strict';
const express = require('express');
const app = express();
const body_parser = require('body-parser');
const history = require('connect-history-api-fallback');
const http = require('http');
const https = require('https');
const fs = require('fs');


module.exports = (discordClient, config, logger)=> {
    const portHttp = process.env.PORT || config.port;
    const portHttps = portHttp+1;
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
    app.use(function(req, res, next) {
        const host = req.get('Host');
        const port = host.split(':')[1];
        
        if((port == portHttp) && host.indexOf('localhost') < 0 && host.indexOf('192.168.178.31') < 0) {
            res.redirect(`https://${req.hostname}:${portHttps}${req.url}`);
        }
        else{
            next();
        }
    });
    app.use(body_parser.json({limit: '20mb'}));
    const staticFileMiddleware = express.static(__dirname+'/../../dist');
    app.use(staticFileMiddleware);
    app.use(history());
    app.use(staticFileMiddleware);

    const router = express.Router();

    require('./routes.js')(router, logger, discordClient, config);
    app.use('/api',router);
    
    http.createServer(app).listen(portHttp);
    https.createServer({
        key: fs.readFileSync(__dirname+'/cert/privkey.pem'),
        cert: fs.readFileSync(__dirname+'/cert/cert.pem')
    }, app)
    .listen(portHttps);
    
};