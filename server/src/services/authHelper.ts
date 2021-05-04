import { verify, sign } from 'jsonwebtoken';
import FormData from 'form-data';
import axios from 'axios';
import Logger from './logger';
import { DatabaseHelper } from './databaseHelper';
import { DiscordBot } from '../discordServer/DiscordBot';
import { UserPayload } from '../models/UserPayload';
import { Request } from 'express';
import { UserToken } from '../models/UserToken';

export default class AuthHelper {
    private readonly secret: string = process.env.WEBTOKEN_SECRET!;
    private readonly clientSecret: string = process.env.CLIENT_SECRET!;
    private readonly scope: string = process.env.SCOPE!;
    constructor(private logger: Logger, private databaseHelper: DatabaseHelper, private discordBot: DiscordBot) { }

    /**
     * Login with a provided code
     * @param code Code generated via OAuth2
     * @param redirectUrl Url 
     * @returns encoded token
     */
    async login(code: string, redirectUrl: string): Promise<string> {
        let token: string;
        const formData = new FormData();
        formData.append('client_id', this.discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', redirectUrl);
        formData.append('scope', this.scope);
        formData.append('code', code);

        const response = await axios.post('https://discord.com/api/oauth2/token', {
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        const userToken: UserToken = response.data;

        const user = await this.discordBot.fetchUserData(userToken);
        const payload = user as UserPayload;
        payload.isSuperAdmin = this.discordBot.isSuperAdmin(payload.id);
        token = sign(payload, this.secret);
        this.databaseHelper.addUser(payload, userToken);
        return token;
    }

    async refreshToken(refresh_token: string, scope: string, request_url: string): Promise<UserToken> {
        const formData = new FormData();

        formData.append('client_id', this.discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'refresh_token');
        formData.append('redirect_uri', request_url);
        formData.append('scope', scope);
        formData.append('refresh_token', refresh_token);

        const { data } = await axios.get('https://discord.com/api/oauth2/token', {
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    }

    /**
     * validates webtoken and stores payload in request
     * @param req 
     * @returns status if webtoken is valid
     */
    async auth(req: Request): Promise<boolean> {
        let valid = false;
        if (req.headers.authorization) {
            try {
                const payload = this.getPayload(req);
                const userToken = await this.databaseHelper.getUserToken(payload.id);
                await this.checkTokenExpired(payload, userToken, `${req.headers.referer}Login`);
                req.body.payload = payload;
                valid = true;
            }
            catch { }
        }
        return valid;
    }

    /**
     * 
     * @param authToken 
     * @returns Payload or throws an exception if proviced token is invalid
     */
    private getPayload(authToken: string | Request): UserPayload {
        return verify((typeof authToken === 'string' ? authToken : this.getToken(authToken as Request)) ?? '', this.secret) as UserPayload;
    }

    // because of validation before token must be set
    private getToken(req: Request): string {
        return req.headers.authorization!.split(' ')[1]; // strip 'Bearer'
    }

    async tryGetToken(authToken: string) {
        const decoded = this.getPayload(authToken);
        return await this.databaseHelper.getUser(decoded.id);
    }

    async checkTokenExpired(payload: UserPayload, userToken: UserToken, request_url: string) {
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