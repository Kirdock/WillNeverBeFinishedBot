import { verify, sign } from 'jsonwebtoken';
import axios from 'axios';
import { Logger } from './logger';
import { DatabaseHelper } from './databaseHelper';
import { DiscordBot } from '../discordServer/DiscordBot';
import { UserPayload } from '../models/UserPayload';
import { Response } from 'express';
import { UserToken } from '../models/UserToken';

export class AuthHelper {
    private readonly secret: string = process.env.WEBTOKEN_SECRET!;
    private readonly clientSecret: string = process.env.CLIENT_SECRET!;
    private readonly scope: string = process.env.SCOPE!;
    private readonly redirectUrl: string = new URL('/Login', process.env.HOST).toString();

    constructor(private logger: Logger, private databaseHelper: DatabaseHelper, private discordBot: DiscordBot) { }

    /**
     * Login with a provided code
     * @param code Code generated via OAuth2
     * @returns encoded token
     */
    async login(code: string): Promise<string> {
        const formData = new URLSearchParams();
        formData.append('client_id', this.discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', this.redirectUrl);
        formData.append('scope', this.scope);
        formData.append('code', code);
        
        const response = await axios.post('https://discord.com/api/oauth2/token', formData,
            {headers: {'content-type': 'application/x-www-form-urlencoded'}}
        );
        const userToken: UserToken = response.data;
        const user = await this.discordBot.fetchUserData(userToken);
        const _id = await this.databaseHelper.updateUserToken(user.id, userToken);
        const payload: UserPayload = new UserPayload(_id.toHexString(), user.id, user.username, this.discordBot.isSuperAdmin(user.id));
        return sign(JSON.stringify(payload), this.secret);
    }

    private async refreshToken(refresh_token: string, scope: string): Promise<UserToken> {
        const formData = new URLSearchParams();
        formData.append('client_id', this.discordBot.id);
        formData.append('client_secret', this.clientSecret);
        formData.append('grant_type', 'refresh_token');
        formData.append('redirect_uri', this.redirectUrl);
        formData.append('scope', scope);
        formData.append('refresh_token', refresh_token);

        const { data } = await axios.post('https://discord.com/api/oauth2/token', formData,
            {headers: {'content-type': 'application/x-www-form-urlencoded'}}
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
        if(!authToken) {
            return false;
        }
        try {
            const payload = this.getPayload(authToken);
            const userToken = await this.databaseHelper.getUserToken(payload.id);
            if(userToken._id.toHexString() === payload._id && payload.id === userToken.userId) {
                await this.checkTokenExpired(payload, userToken);
                res.locals.payload = payload;
            }
        }
        catch (e) {
            this.logger.error(e, 'Auth failed');
        }
        return !!res.locals.payload;
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

    private async checkTokenExpired(payload: UserPayload, userToken: UserToken): Promise<void> {
        const timeBegin = userToken.time;
        const expire = userToken.expires_in;
        const timeNow = new Date().getTime();
        if ((timeNow - timeBegin) / 1000 > expire) {
            await this.databaseHelper.updateUserToken(payload.id, userToken);
            //reset time just in case there are several requests by the user
            //else there will be several refresh request if the first one has not received a response

            userToken = await this.refreshToken(userToken.refresh_token, userToken.scope);
            await this.databaseHelper.updateUserToken(payload.id, userToken);
        }
    }
}