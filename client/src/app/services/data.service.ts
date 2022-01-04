import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Channel } from '../models/Channel';
import { Log } from '../models/Log';
import { PlaySoundRequest } from '../models/PlaySoundRequest';
import { IServer } from '../interfaces/IServer';
import { SoundMeta } from '../models/SoundMeta';
import { Sounds } from '../models/Sounds';
import { User } from '../models/User';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { IServerSettings } from '../../../../shared/interfaces/server-settings';
import { AudioExportType } from '../../../../shared/models/types';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _hasAdminServers: BehaviorSubject<boolean | undefined> = new BehaviorSubject<boolean | undefined>(undefined);
  private _sounds: BehaviorSubject<Sounds> = new BehaviorSubject<Sounds>({});
  private _servers: BehaviorSubject<IServer[]> = new BehaviorSubject<IServer[]>([]);
  private _channels: BehaviorSubject<Channel[]> = new BehaviorSubject<Channel[]>([]);
  private _selectedServer: BehaviorSubject<IServer | undefined> = new BehaviorSubject<IServer | undefined>(undefined);
  private _soundFetchTime: Date = new Date();

  constructor(private apiService: ApiService, private storageService: StorageService) {
  }

  private get location(): string {
    return `${window.location.protocol}//${window.location.host}`;
  }

  public get oauthLink(): string {
    return `https://discord.com/api/oauth2/authorize?client_id=${environment.clientId}&redirect_uri=${this.location}/Login&response_type=code&scope=identify`;
  }

  public get addServerLink(): string {
    return `https://discord.com/api/oauth2/authorize?client_id=${environment.clientId}&permissions=3148800&redirect_uri=${this.location}&scope=bot`;
  }

  public get selectedServer(): Observable<IServer | undefined> {
    return this._selectedServer.asObservable();
  }

  public setSelectedServer(server: IServer | undefined): void {
    this._selectedServer.next(server);
  }

  public get sounds(): Observable<Sounds> {
    return this._sounds.asObservable();
  }

  public get hasAdminServers(): Observable<boolean> {
    return this._hasAdminServers.asObservable().pipe(filter((val: boolean | undefined): val is boolean => val !== undefined));
  }

  public get servers(): Observable<IServer[]> {
    return this._servers.asObservable();
  }

  public get channels(): Observable<Channel[]> {
    return this._channels.asObservable();
  }

  public login(code: string): Observable<string> {
    return this.apiService.login(code)
      .pipe(
        tap(token => {
          this.storageService.token = token;
          this.update();
        })
      );
  }

  public logout(): void {
    this.storageService.deleteToken();
  }

  public setHasAdminServers(): void {
    this.apiService.hasAdminServers().subscribe(status => {
      if (this._hasAdminServers.getValue() !== status) {
        this._hasAdminServers.next(status);
      }
    });
  }

  public submitFile(files: FileList, category: string, serverId: string): Observable<SoundMeta[]> {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('serverId', serverId);

    for (let i = 0; i < files.length; i++) {
      formData.append(`files`, files[i]);
    }
    return this.apiService.uploadFile(formData).pipe(
      tap(() => {
        this.loadSounds(serverId, true);
      })
    );
  }

  public playSound(data: PlaySoundRequest): Observable<any> {
    return this.apiService.playSound(data);
  }

  public loadSounds(serverId: string, time = false) {
    let fromTime: Date | undefined = undefined;
    if (time) {
      fromTime = this._soundFetchTime;
    }
    this._soundFetchTime = new Date();
    this.apiService.getSounds(serverId, fromTime)
      .pipe(
        map(newSoundsMetas => newSoundsMetas.map(meta => SoundMeta.fromJSON(meta)))
      ).subscribe(newSounds => {
      if (!fromTime || newSounds.length !== 0) {
        const sounds = newSounds.reduce((result: Sounds, sound: SoundMeta) => {
          if (!result[sound.category]) {
            result[sound.category] = [];
          }
          result[sound.category].push(sound);

          return result;
        }, fromTime ? this._sounds.getValue() : {});
        for (const category in sounds) {
          sounds[category].sort((soundA, soundB) => soundA.fileName.localeCompare(soundB.fileName));
        }
        this._sounds.next(sounds);
      }
    });
  }

  public loadServers() {
    this.apiService.getServers().subscribe(newServers => {
      this._servers.next(newServers);
    });
  }

  public loadChannels(serverId: string) {
    this.apiService.getChannels(serverId).subscribe(newChannels => {
      this._channels.next(newChannels);
    });
  }

  public deleteSound(soundId: string): Observable<any> {
    return this.apiService.deleteSound(soundId);
  }

  public downloadSound(soundId: string): Observable<HttpResponse<Blob>> {
    return this.apiService.downloadSound(soundId);
  }

  public stopPlaying(serverId: string): Observable<any> {
    return this.apiService.stopPlaying(serverId);
  }

  public updateIntro(soundId: string | undefined, serverId: string, userId?: string): Observable<any> {
    return this.apiService.updateIntro(soundId, serverId, userId);
  }

  public getServerSettings(serverId: string) {
    return this.apiService.getServerSettings(serverId);
  }

  public updateServerSettings(serverSettings: IServerSettings): Observable<any> {
    return this.apiService.updateServerSettings(serverSettings);
  }

  public getUsersData(serverId: string): Observable<User[]> {
    return this.apiService.fetchUsersData(serverId);
  }

  public getUserIntro(serverId: string): Observable<string> {
    return this.apiService.getUserIntro(serverId);
  }

  public getLogs(serverId: string, pageSize?: number, pageKey?: number, fromTime?: Date): Observable<Log[]> {
    return this.apiService.getLogs(serverId, pageSize, pageKey, fromTime);
  }

  public update(): void {
    this.loadServers();
    this.setHasAdminServers();
  }

  public downloadRecordedVoice(serverId: string, recordType: AudioExportType, recordTime: number): Observable<HttpResponse<Blob>> {
    return this.apiService.downloadRecordedVoice(serverId, recordType, recordTime);
  }
}
