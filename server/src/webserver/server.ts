import express, { NextFunction } from 'express';
import history from 'connect-history-api-fallback';
import https from 'https';
import AuthHelper from '../services/authHelper';
import FileHelper from '../services/fileHelper';
import Logger from '../services/logger';
import { Request, Response } from 'express';
import { join } from 'path';

export class WebServer {
    constructor(router: express.Router, private authHelper: AuthHelper, private fileHelper: FileHelper, private logger: Logger) {
        const port: number = +process.env.PORT!;
        const app = express();
        const staticFileMiddleware = express.static(join(this.fileHelper.rootDir, 'client', 'dist'));

        app.use(this.cors);
        app.use(express.json({ limit: '20mb' }));
        app.use(staticFileMiddleware);
        app.use(history());
        app.use(staticFileMiddleware);
        app.use(this.authentication);
        app.use('/api', router);

        if (!this.fileHelper.existsFile(join(this.fileHelper.certFolder, 'privkey.pem'))) {
            console.log('start local');
            app.listen(port);
        }
        else {
            https.createServer({
                key: this.fileHelper.readFile(join(this.fileHelper.certFolder, 'privkey.pem')),
                cert: this.fileHelper.readFile(join(this.fileHelper.certFolder, 'cert.pem'))
            }, app)
                .listen(port);
        }
    }

    private cors(req: Request, res: Response, next: NextFunction) {
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
    }

    private async authentication(req: Request, res: Response, next: NextFunction) {
        if (req.url === '/Login') {
            next();
        } else {
            if (!req.headers.authorization) {
                res.redirect('/Login');
            }
            else if (await this.authHelper.auth(req)) {
                next();
            }
            else {
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