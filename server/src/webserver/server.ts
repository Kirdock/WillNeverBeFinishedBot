import express from 'express';
import body_parser from 'body-parser';
import history from 'connect-history-api-fallback';
import https from 'https';
import fs from 'fs';
import AuthHelper from '../services/authHelper';
import FileHelper from '../services/fileHelper';
import Logger from '../services/logger';

export class WebServer {
    constructor(router: express.Router, authHelper: AuthHelper, fileHelper: FileHelper, logger: Logger) {
        const port: number = +process.env.PORT!;
        const app = express();
        const staticFileMiddleware = express.static(__dirname + '/../../client/dist');

        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

            // intercept OPTIONS method
            if ('OPTIONS' === req.method) {
                res.send(200);
            }
            else {
                next();
            }
        });
        app.use(async (req, res, next) => {
            if (req.route === '/Login') {
                next();
            } else {
                if (await authHelper.auth(req)) {
                    next();
                } else {
                    if (req.files) {
                        try {
                            await fileHelper.deleteFiles(req.files);
                        }
                        catch (error) {
                            logger.error(error, 'DeleteFiles');
                        }
                    }
                    res.send(401);
                }
            }
        })
        app.use(body_parser.json({ limit: '20mb' }));
        app.use(staticFileMiddleware);
        app.use(history());
        app.use(staticFileMiddleware);
        app.use('/api', router);

        if (!fs.existsSync(__dirname + '/cert/privkey.pem')) {
            console.log('start local')
            app.listen(port);
        }
        else {
            https.createServer({
                key: fs.readFileSync(__dirname + '/cert/privkey.pem'),
                cert: fs.readFileSync(__dirname + '/cert/cert.pem')
            }, app)
                .listen(port);
        }
    }
}