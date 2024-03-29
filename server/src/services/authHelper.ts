import { sign, verify } from 'jsonwebtoken';
import axios from 'axios';
import { databaseHelper } from './databaseHelper';
import { discordBot } from '../discordServer/DiscordBot';
import type { Express, NextFunction, Request, Response } from 'express';
import type { IUserToken } from '../interfaces/UserToken';
import { createUserPayload } from '../utils/UserPayload';
import type { IUserPayload } from '../interfaces/user-payload';
import { scopedLogger } from './logHelper';
import { EnvironmentConfig } from './config';
import { fileHelper } from './fileHelper';

const logger = scopedLogger('AUTH');

class AuthHelper {
    private readonly secret: string;
    private readonly clientSecret: string;
    private readonly scope: string;
    private readonly redirectUrl: string;

    constructor() {
        this.secret = EnvironmentConfig.WEBTOKEN_SECRET;
        this.clientSecret = EnvironmentConfig.CLIENT_SECRET;
        this.scope = EnvironmentConfig.SCOPE;
        this.redirectUrl = new URL('/Login', EnvironmentConfig.HOST).toString();
    }

    /**
     * Login with a provided code
     * @param code Code generated via OAuth2
     * @returns encoded token
     */
    async login(code: string): Promise<string> {
        const formData = new URLSearchParams();
        formData.append('client_id', discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', this.redirectUrl);
        formData.append('scope', this.scope);
        formData.append('code', code);

        const response = await axios.post('https://discord.com/api/oauth2/token', formData,
            { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
        );
        const userToken: IUserToken = response.data;
        const user = await discordBot.fetchUserData(userToken);
        const _id = await databaseHelper.updateUserToken(user.id, userToken);
        if (!_id) {
            throw new Error('Updating user token did not work');
        }
        const payload = createUserPayload(_id.toHexString(), user.id, user.username, discordBot.isSuperAdmin(user.id));
        return sign(JSON.stringify(payload), this.secret);
    }

    private async refreshToken(refresh_token: string): Promise<IUserToken> {
        const formData = new URLSearchParams();
        formData.append('client_id', discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'refresh_token');
        formData.append('redirect_uri', this.redirectUrl);
        formData.append('scope', 'identify');
        formData.append('refresh_token', refresh_token);

        const { data } = await axios.post('https://discord.com/api/oauth2/token', formData,
            { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
        );
        return data;
    }

    /**
     * validates webtoken and stores payload in request
     * @param authToken
     * @param res
     * @returns status if webtoken is valid
     */
    async auth(authToken: string | undefined, res: Response): Promise<boolean> {
        if (!authToken) {
            return false;
        }
        try {
            const payload = this.getPayload(authToken);
            const userToken = await databaseHelper.getUserToken(payload.id);
            if (userToken._id.toHexString() === payload._id && payload.id === userToken.userId) {
                await this.checkTokenExpired(payload, userToken);
                res.locals.payload = payload;
            }
        } catch (e) {
            logger.error(e as Error, 'Auth failed');
        }
        return !!res.locals.payload;
    }

    /**
     *
     * @param authToken
     * @throws exception if token is invalid
     * @returns Payload (decoded Token)
     */
    private getPayload(authToken: string): IUserPayload {
        return verify(authToken, this.secret) as IUserPayload;
    }

    private async checkTokenExpired(payload: IUserPayload, userToken: IUserToken): Promise<void> {
        const timeBegin = userToken.time;
        const expire = userToken.expires_in;
        const timeNow = new Date().getTime();
        if ((timeNow - timeBegin) / 1000 > expire) {
            await databaseHelper.updateUserToken(payload.id, userToken);
            //reset time just in case there are several requests by the user
            //else there will be several refresh request if the first one has not received a response

            userToken = await this.refreshToken(userToken.refresh_token);
            await databaseHelper.updateUserToken(payload.id, userToken);
        }
    }

    public registerAuthentication(app: Express, baseUrl: string): void {
        app.use((req, res, next) => this.authentication(req, res, next, baseUrl));
    }

    public async authentication(req: Request, res: Response, next: NextFunction, baseUrl: string) {
        if (req.url === `${baseUrl}/login`) {
            next();
            return;
        }

        if (!req.headers.authorization) {
            res.redirect('/Login');
            await this.checkFiles(req);
            return;
        }

        if (await this.auth(req.headers.authorization.split(' ')[1], res)) {
            next();
            return;
        }

        res.sendStatus(401);
        await this.checkFiles(req);
    }

    public async checkFiles(req: Request) {
        if (req.files?.length) {
            await fileHelper.deleteFiles(req.files);
        }
    }
}

export const authHelper = new AuthHelper();
