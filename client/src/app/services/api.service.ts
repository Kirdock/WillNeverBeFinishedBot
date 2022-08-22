import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IChannel } from '../interfaces/Channel';
import { ILog } from '../interfaces/Log';
import { IServer } from '../interfaces/IServer';
import { IUser } from '../interfaces/User';
import { IServerSettings } from '../../../../shared/interfaces/server-settings';
import { AudioExportType } from '../../../../shared/models/types';
import { IPlaySoundRequest } from '../interfaces/play-sound-request';
import { ISoundMeta } from '../interfaces/sound-meta';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  public login(code: string): Observable<string> {
    return this.http.post('login', {code}, {responseType: 'text'});
  }

  public updateIntro(soundId: string | undefined, serverId: string, userId?: string): Observable<any> {
    return this.http.post<any>('userIntro', {soundId, userId, serverId});
  }

  public downloadSound(soundId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`sound/${soundId}`, {responseType: 'blob', observe: 'response'});
  }

  public updateServerSettings(serverSettings: IServerSettings): Observable<any> {
    return this.http.post('serverSettings', {serverSettings});
  }

  public fetchUsersData(serverId: string): Observable<IUser[]> {
    return this.http.get<IUser[]>(`users/${serverId}`);
  }

  public getUserIntro(serverId: string): Observable<string> {
    return this.http.get<string>(`userIntro/${serverId}`);
  }

  public getServers(): Observable<IServer[]> {
    return this.http.get<IServer[]>('servers');
  }

  public getServerSettings(serverId: string): Observable<IServerSettings> {
    return this.http.get<IServerSettings>(`serverSettings/${serverId}`);
  }

  public playSound(data: IPlaySoundRequest): Observable<any> {
    return this.http.post('playSound', data);
  }

  public deleteSound(id: string): Observable<any> {
    return this.http.delete(`deleteSound/${id}`);
  }

  public uploadFile(formData: FormData): Observable<any> {
    return this.http.post('uploadFile', formData); //{headers: {'Content-Type': undefined}}
  }

  public getSounds(serverId: string, fromTime?: Date): Observable<ISoundMeta[]> {
    const params = {
      ...(fromTime && {fromTime: fromTime.getTime()})
    };
    return this.http.get<ISoundMeta[]>(`sounds/${serverId}`, {params})
  }

  public getChannels(serverId: string): Observable<IChannel[]> {
    return this.http.get<IChannel[]>(`channels/${serverId}`);
  }

  public stopPlaying(serverId: string): Observable<any> {
    return this.http.get(`stopPlaying/${serverId}`);
  }

  public hasAdminServers(): Observable<boolean> {
    return this.http.get<boolean>('hasAdminServers');
  }

  public getLogs(serverId: string, pageSize?: number, pageKey?: number, fromTime?: Date): Observable<ILog[]> {
    const params = {
      ...(pageSize && {pageSize}),
      ...(pageKey && {pageKey}),
      ...(fromTime && {fromTime: fromTime.getTime()}),
    };
    return this.http.get<ILog[]>(`logs/${serverId}`, {params});
  }

  public downloadRecordedVoice(serverId: string, recordType: AudioExportType, recordMinutes: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`recordVoice/${serverId}`, {
      params: {
        minutes: recordMinutes,
        recordType
      },
      responseType: 'blob',
      observe: 'response'
    });
  }
}
