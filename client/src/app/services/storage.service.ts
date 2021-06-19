import { Injectable } from "@angular/core";
import { HomeSettings } from "../models/HomeSettings";
import { UserPayload } from "../models/UserPayload";

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private _token: string = '';
    private _settings?: HomeSettings;
    private readonly storage = window.localStorage;
    private readonly tokenName = 'OiToken';
    private readonly homeSettingsName = 'Settings';
    private userPayload?: UserPayload;
    
    public get token(): string {
        this._token ||= this.storage.getItem(this.tokenName) || '';
        return this._token;
    }

    public set token(token: string) {
        this._token = token;
        this.storage.setItem(this.tokenName, token);
    }

    public get settings(): HomeSettings {
        if(!this._settings) {
            const settings = this.storage.getItem(this.homeSettingsName);
            if(settings){
                this._settings = HomeSettings.fromJSON(JSON.parse(settings));
            }
            else {
                this._settings = new HomeSettings();
            }
        }
        return this._settings!;
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
            try {
                const base64Url = this.token.split('.')[1];
                const base64 = base64Url?.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                this.userPayload = JSON.parse(jsonPayload) as UserPayload;
            }
            catch {}
        }
        return this.userPayload;
    }
}