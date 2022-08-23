import express, { NextFunction, Request, Response } from 'express';
import history from 'connect-history-api-fallback';
import https from 'https';
import { AuthHelper } from '../services/authHelper';
import { FileHelper } from '../services/fileHelper';
import { Logger } from '../services/logger';
import { join } from 'path';
import { IEnvironmentVariables } from '../interfaces/environment-variables';

const baseUrl = '/api';

export function startServer(router: express.Router, authHelper: AuthHelper, logger: Logger, config: IEnvironmentVariables) {
    const port: number = +config.PORT;
    const app = express();
    const staticFileMiddleware = express.static(join(FileHelper.rootDir, 'client', 'dist'));
    const privateKeyPath = join(FileHelper.certFolder, 'privkey.pem');
    const certPath = join(FileHelper.certFolder, 'cert.pem');

    app.use(cors);
    app.use(express.json({limit: '20mb'}));
    app.use(staticFileMiddleware);
    app.use(history());
    app.use(staticFileMiddleware);
    authHelper.registerAuthentication(app, baseUrl);
    app.use(baseUrl, router);

    if (!FileHelper.existsFile(privateKeyPath)) {
        console.log('start local');
        app.listen(port);
    } else {
        https.createServer({
            key: FileHelper.readFile(privateKeyPath),
            cert: FileHelper.readFile(certPath)
        }, app)
            .listen(port);
    }
}

function cors(req: Request, res: Response, next: NextFunction) {
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