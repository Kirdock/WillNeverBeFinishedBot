import { verify, sign } from 'jsonwebtoken';
import axios from 'axios';
import { Logger } from './logger';
import { DatabaseHelper } from './databaseHelper';
import { DiscordBot } from '../discordServer/DiscordBot';
import { UserPayload } from '../models/UserPayload';
import { Request, Response } from 'express';
import { UserToken } from '../models/UserToken';

export class AuthHelper {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    private readonly secret: string = process.env.WEBTOKEN_SECRET!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    private readonly clientSecret: string = process.env.CLIENT_SECRET!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    private readonly scope: string = process.env.SCOPE!;
    constructor(private logger: Logger, private databaseHelper: DatabaseHelper, private discordBot: DiscordBot) { }

    /**
     * Login with a provided code
     * @param code Code generated via OAuth2
     * @param redirectUrl Url 
     * @returns encoded token
     */
    async login(code: string, req: Request): Promise<string> {
        const formData = new URLSearchParams();
        formData.append('client_id', this.discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', this.buildRedirectUri(req));
        formData.append('scope', this.scope);
        formData.append('code', code);
        
        const response = await axios.post('https://discord.com/api/oauth2/token', formData,
            {headers: {'content-type': 'application/x-www-form-urlencoded'}}
        );
        const userToken: UserToken = response.data;
        const user = await this.discordBot.fetchUserData(userToken);
        await this.databaseHelper.updateUserToken(user.id, userToken);
        const payload: UserPayload = new UserPayload(user.id, user.username, this.discordBot.isSuperAdmin(user.id));
        const token = sign(JSON.stringify(payload), this.secret);
        return token;
    }

    async refreshToken(refresh_token: string, scope: string, request_url: string): Promise<UserToken> {
        const formData = new URLSearchParams();
        formData.append('client_id', this.discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'refresh_token');
        formData.append('redirect_uri', request_url);
        formData.append('scope', scope);
        formData.append('refresh_token', refresh_token);

        const { data } = await axios.post('https://discord.com/api/oauth2/token', formData,
            {headers: {'content-type': 'application/x-www-form-urlencoded'}}
        );
        return data;
    }

    /**
     * validates webtoken and stores payload in request
     * @param req 
     * @returns status if webtoken is valid
     */
    async auth(authToken: string, req: Request, res: Response): Promise<boolean> {
        try {
            const payload = this.getPayload(authToken);
            const userToken = await this.databaseHelper.getUserToken(payload.id);
            await this.checkTokenExpired(payload, userToken, this.buildRedirectUri(req));
            res.locals.payload = payload;
        }
        catch (e) {
            this.logger.error(e, 'Auth failed');
        }
        return !!res.locals.payload;
    }

    private buildRedirectUri(req: Request): string {
        return `${req.protocol}://${req.get('host')}/Login`;
    }

    /**
     * 
     * @param authToken 
     * @throws exception if token is invalid
     * @returns Payload (decoded Token)
     */
    private getPayload(authToken: string): UserPayload {
        return verify(authToken, this.secret) as UserPayload;
    }

    async checkTokenExpired(payload: UserPayload, userToken: UserToken, request_url: string): Promise<void> {
        const timeBegin = userToken.time;
        const expire = userToken.expires_in;
        const timeNow = new Date().getTime();
        if ((timeNow - timeBegin) / 1000 > expire) {
            await this.databaseHelper.updateUserToken(payload.id, userToken);
            //reset time just in case there are several requests by the user
            //else there will be several refresh request if the first one has not received a response

            userToken = await this.refreshToken(userToken.refresh_token, userToken.scope, request_url);
            await this.databaseHelper.updateUserToken(payload.id, userToken);
        }
    }
}