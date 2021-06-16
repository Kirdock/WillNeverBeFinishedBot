import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Channel } from "../models/Channel";
import { Log } from "../models/Log";
import { PlaySoundRequest } from "../models/PlaySoundRequest";
import { Server } from "../models/Server";
import { ServerSettings } from "../models/ServerSettings";
import { SoundMeta } from "../models/SoundMeta";
import { User } from "../models/User";

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
        return this.http.post<any>('setIntro', {soundId, userId, serverId});
    }

    public downloadSound(soundId: string): Observable<HttpResponse<Blob>>{
        return this.http.get(`sound/${soundId}`, {responseType: 'blob', observe: 'response'});
    }

    public updateServerSettings(serverSettings: ServerSettings): Observable<any> {
        return this.http.post('serverSettings', serverSettings);
    }

    public fetchUsersData(serverId: string): Observable<User[]>{
        return this.http.get<User[]>('users/'+serverId);
    }

    public fetchUserData(serverId: string){
        return this.http.get('user/'+serverId);
    }

    public getServers(): Observable<Server[]>{
        return this.http.get<Server[]>('servers');
    }

    public getServerSettings(serverId: string): Observable<ServerSettings> {
        return this.http.get<ServerSettings>(`serverSettings/${serverId}`);
    }

    public playSound(data: PlaySoundRequest): Observable<any>{
        return this.http.post('playSound', data);
    }

    public deleteSound(id: string): Observable<any> {
        return this.http.delete(`deleteSound/${id}`);
    }

    public fetchCategories(): Observable<string[]> {
        return this.http.get<string[]>('soundCategories');
    }

    public uploadFile(formData: FormData): Observable<SoundMeta[]>{
        return this.http.post<SoundMeta[]>('uploadFile', formData); //{headers: {'Content-Type': undefined}}
    }

    public getSounds(serverId: string, fromTime?: Date): Observable<SoundMeta[]> {
        const params: any = {};
        if(fromTime) {
            params.fromTime = fromTime.toISOString();
        }
        return this.http.get<SoundMeta[]>(`sounds/${serverId}`, {params})
    }

    public getChannels(serverId: string): Observable<Channel[]>{
        return this.http.get<Channel[]>(`channels/${serverId}`);
    }

    public stopPlaying(serverId: string): Observable<any> {
        return this.http.get(`stopPlaying/${serverId}`);
    }

    public hasAdminServers(): Observable<boolean>{
        return this.http.get<boolean>('hasAdminServers');
    }

    public getLogs(serverId: string, pageSize?: number, pageKey?: number, fromTime?: Date): Observable<Log[]> {
        const params: any = {};
        if(pageSize) {
            params.pageSize = pageSize;
        }
        if(pageKey) {
            params.pageKey = pageKey;
        }
        if(fromTime) {
            params.fromTime = fromTime.toISOString();
        }
        return this.http.get<Log[]>(`logs/${serverId}`, {params});
    }
}