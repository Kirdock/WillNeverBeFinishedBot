import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Channel } from "../models/Channel";
import { PlaySoundRequest } from "../models/PlaySoundRequest";
import { Server } from "../models/Server";
import { SoundMeta } from "../models/SoundMeta";
import { UserServerInformation } from "../models/UserServerInformation";

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    
    constructor(private http: HttpClient) {
    }

    public login(code: string, redirectUrl: string): Observable<string> {
        return this.http.post<string>('login', {code, redirectUrl});
    }

    public setIntro(soundId: string, serverId: string, userId?: string): Observable<any> {
        return this.http.post<any>('setIntro', {soundId, userId, serverId});
    }

    public downloadSound(soundId: string): Observable<HttpResponse<ArrayBuffer>>{
        return this.http.get(`sound/${soundId}`, {responseType: 'arraybuffer', observe: 'response'});
    }

    public updateServerInfo(serverInfo: UserServerInformation): Observable<any> {
        return this.http.post('serverInfo', {serverInfo});
    }

    public fetchUsersData(serverId: string){
        return this.http.get('users/'+serverId);
    }

    public fetchUserData(serverId: string){
        return this.http.get('user/'+serverId);
    }

    public getServers(): Observable<Server[]>{
        return this.http.get<Server[]>('servers');
    }

    public fetchLogs(serverId: string){
        return this.http.get(`log/${serverId}`);
    }

    public playSound(data: PlaySoundRequest){
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
}