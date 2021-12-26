import express, { NextFunction, Request, Response } from 'express';
import history from 'connect-history-api-fallback';
import https from 'https';
import { AuthHelper } from '../services/authHelper';
import { FileHelper } from '../services/fileHelper';
import { Logger } from '../services/logger';
import { join } from 'path';
import { IEnvironmentVariables } from '../interfaces/environment-variables';

export class WebServer {
    private readonly baseUrl = '/api';

    constructor(router: express.Router, private authHelper: AuthHelper, private fileHelper: FileHelper, private logger: Logger, config: IEnvironmentVariables) {
        const port: number = +config.PORT;
        const app = express();
        const staticFileMiddleware = express.static(join(FileHelper.rootDir, 'client', 'dist'));

        app.use(this.cors);
        app.use(express.json({limit: '20mb'}));
        app.use(staticFileMiddleware);
        app.use(history());
        app.use(staticFileMiddleware);
        app.use((req, res, next) => this.authentication(req, res, next));
        app.use(this.baseUrl, router);

        if (!this.fileHelper.existsFile(join(this.fileHelper.certFolder, 'privkey.pem'))) {
            console.log('start local');
            app.listen(port);
        } else {
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
            res.sendStatus(200);
        } else {
            next();
        }
    }

    private async authentication(req: Request, res: Response, next: NextFunction) {
        if (req.url === `${this.baseUrl}/login`) {
            next();
        } else {
            if (!req.headers.authorization) {
                res.redirect('/Login');
                await this.checkFiles(req);
            } else if (await this.authHelper.auth(req.headers.authorization.split(' ')[1], res)) {
                next();
            } else {
                res.sendStatus(401);
                await this.checkFiles(req);
            }
        }
    }

    private async checkFiles(req: Request) {
        if (req.files?.length) {
            await this.fileHelper.deleteFiles(req.files);
        }
    }
}