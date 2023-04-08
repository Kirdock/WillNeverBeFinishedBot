import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import history from 'connect-history-api-fallback';
import https from 'https';
import { authHelper } from '../services/authHelper';
import { join } from 'path';
import { EnvironmentConfig } from '../services/config';
import { fileHelper } from '../services/fileHelper';
import { scopedLogger } from '../services/logHelper';

const baseUrl = '/api';
const logger = scopedLogger('SERVER');

export function startServer(router: express.Router) {
    const port: number = +EnvironmentConfig.PORT;
    const app = express();
    const staticFileMiddleware = express.static(join(fileHelper.rootDir, 'client', 'dist'));
    const privateKeyPath = join(fileHelper.certFolder, 'privkey.pem');
    const certPath = join(fileHelper.certFolder, 'cert.pem');

    app.use(cors);
    app.use(express.json({ limit: '20mb' }));
    app.use(staticFileMiddleware);
    app.use(history());
    app.use(staticFileMiddleware);
    authHelper.registerAuthentication(app, baseUrl);
    app.use(baseUrl, router);

    if (!fileHelper.existsFile(privateKeyPath)) {
        logger.debug('start local');
        app.listen(port);
    } else {
        https.createServer({
            key: fileHelper.readFile(privateKeyPath),
            cert: fileHelper.readFile(certPath),
        }, app)
            .listen(port);
    }
}

function cors(req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');

    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
}