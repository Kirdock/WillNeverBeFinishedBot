import express, { NextFunction } from 'express';
import history from 'connect-history-api-fallback';
import https from 'https';
import fs from 'fs';
import AuthHelper from '../services/authHelper';
import FileHelper from '../services/fileHelper';
import Logger from '../services/logger';
import { Request, Response } from 'express';

export class WebServer {
    constructor(router: express.Router, private authHelper: AuthHelper, private fileHelper: FileHelper, private logger: Logger) {
        const port: number = +process.env.PORT!;
        const app = express();
        const staticFileMiddleware = express.static(__dirname + '/../../../client/dist');

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
        
        app.use(express.json({ limit: '20mb' }));
        app.use(staticFileMiddleware);
        app.use(history());
        app.use(staticFileMiddleware);

        app.use(this.authentication);
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

    private async authentication(req: Request, res: Response, next: NextFunction) {
        if (req.url === '/Login') {
            next();
        } else {
            if(!req.headers.authorization) {
                res.redirect('/Login');
            }
            else if (await this.authHelper.auth(req)) {
                next();
            } else {
                if (req.files) {
                    try {
                        await this.fileHelper.deleteFiles(req.files);
                    }
                    catch (error) {
                        this.logger.error(error, 'DeleteFiles');
                    }
                }
                res.send(401);
            }
        }
    }
}