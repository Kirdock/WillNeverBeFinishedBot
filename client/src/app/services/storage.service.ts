import { Injectable } from '@angular/core';
import { IUserPayload } from '../interfaces/UserPayload';
import { IHomeSettings } from '../interfaces/home-settings';
import { createHomeSettings } from '../utils/HomeSettings';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _token: string = '';
  private _settings?: IHomeSettings;
  private readonly storage = window.localStorage;
  private readonly tokenName = 'OiToken';
  private readonly homeSettingsName = 'Settings';
  private userPayload?: IUserPayload;

  public get token(): string {
    this._token ||= this.storage.getItem(this.tokenName) || '';
    return this._token;
  }

  public set token(token: string) {
    this._token = token;
    this.storage.setItem(this.tokenName, token);
  }

  public get settings(): IHomeSettings {
    if (!this._settings) {
      const settings = this.storage.getItem(this.homeSettingsName);
      if (settings) {
        this._settings = JSON.parse(settings);
      } else {
        this._settings = createHomeSettings();
      }
    }
    return this._settings!;
  }

  public set settings(settings: IHomeSettings) {
    this.storage.setItem(this.homeSettingsName, JSON.stringify(settings));
  }

  public deleteToken() {
    this._token = '';
    this.userPayload = undefined;
    this.storage.removeItem(this.tokenName);
  }


  public get payload(): IUserPayload | undefined {
    if (!this.userPayload && this.token) {
      try {
        const base64Url = this.token.split('.')[1];
        const base64 = base64Url?.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        this.userPayload = JSON.parse(jsonPayload) as IUserPayload;
      } catch {
      }
    }
    return this.userPayload;
  }
}
