import { Injectable } from "@angular/core";
import { HomeSettings } from "../models/HomeSettings";
import { UserPayload } from "../models/UserPayload";

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private _token: string = '';
    private readonly storage = window.localStorage;
    private readonly tokenName = 'OiToken';
    private readonly homeSettingsName = 'Settings';
    private userPayload?: UserPayload;
    
    public get token(): string {
        if (!this._token) {
            const token = this.storage.getItem(this.tokenName);
            if(token){
                this._token = token;
            }
        }
        return this._token;
    }

    public set token(token: string) {
        this._token = token;
        this.storage.setItem(this.tokenName, token);
    }

    public get settings(): HomeSettings {
        const settings = this.storage.getItem(this.homeSettingsName);
        let result;
        if(settings){
            result = HomeSettings.fromJSON(JSON.parse(settings));
        }
        else {
            result = new HomeSettings();
        }
        return result;
    }

    public set settings(settings: HomeSettings) {
        this.storage.setItem(this.homeSettingsName, JSON.stringify(settings));
    }

    public deleteToken(){
        this._token = '';
        this.userPayload = undefined;
        this.storage.removeItem(this.tokenName);
    }


    public get payload(): UserPayload | undefined {
        if (!this.userPayload && this.token) {
            let payload = this.token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
            if(payload) {
                switch (payload.length % 4) {
                    case 0:
                        break;
                    case 1:
                        payload += "===";
                        break;
                    case 2:
                        payload += "==";
                        break;
                    case 3:
                        payload += "=";
                        break;
                }
                try {
                    this.userPayload = JSON.parse(atob(payload)) as UserPayload;
                }
                catch {}
            }
        }
        return this.userPayload;
    }
}