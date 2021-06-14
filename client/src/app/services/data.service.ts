import { HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PlaySoundRequest } from "../models/PlaySoundRequest";
import { Server } from "../models/Server";
import { ServersChannels } from "../models/ServersChannels";
import { ServersSounds } from "../models/ServersSounds";
import { SoundMeta } from "../models/SoundMeta";
import { Sounds } from "../models/Sounds";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { StorageService } from "./storage.service";

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private _hasAdminServers: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private _sounds: BehaviorSubject<ServersSounds> = new BehaviorSubject<ServersSounds>({});
    private _servers: BehaviorSubject<Server[]> = new BehaviorSubject<Server[]>([]);
    private _channels: BehaviorSubject<ServersChannels> = new BehaviorSubject<ServersChannels>({});

    constructor(private apiService: ApiService, private storageService: StorageService, private authService: AuthService) {
        this.setHasAdminServers();
    }

    public get sounds(): Observable<ServersSounds> {
        return this._sounds.asObservable();
    }

    public get hasAdminServers(): Observable<boolean> {
        return this._hasAdminServers.asObservable();
    }

    public get servers(): Observable<Server[]> {
        return this._servers.asObservable();
    }

    public get channels(): Observable<ServersChannels> {
        return this._channels.asObservable();
    }

    public login(code: string, redirectUrl: string): Observable<string> {
        return this.apiService.login(code, redirectUrl)
        .pipe(
            tap(token => {
                this.storageService.token = token;
            })
        );
    }

    public logout(): void {
        this.storageService.deleteToken();
    }

    public setHasAdminServers(): void {
        if(this.authService.isAuthenticated()) {
            this.apiService.hasAdminServers().subscribe(status => {
                if(this._hasAdminServers.getValue() !== status) {
                    this._hasAdminServers.next(status);
                }
            });
        }
    }

    public submitFile(files: FileList, category: string, serverId: string): Observable<SoundMeta[]> {
        const formData = new FormData();
        formData.append('category', category);
        formData.append('serverId', serverId);
        
        for(let i = 0; i < files.length; i++) {
            formData.append(`files`, files[i]);
        }
        return this.apiService.uploadFile(formData).pipe(
            tap(newSoundMetas => {
                const allSounds = this._sounds.getValue();
                if(!allSounds[serverId]) {
                    allSounds[serverId] = {};
                }
                const sounds = allSounds[serverId];
                sounds[category].push(...newSoundMetas);
                sounds[category].sort((a,b) => a.fileName.localeCompare(b.fileName));
            })
        );
    }

    public playSound(data: PlaySoundRequest) {
        return this.apiService.playSound(data);
    }

    public loadSounds(serverId: string, fromTime?: Date) {
        this.apiService.getSounds(serverId, fromTime).subscribe(serverSounds => {
            const sounds = this._sounds.getValue();
            
            sounds[serverId] = serverSounds.reduce((result: Sounds, sound: SoundMeta) => {
                if(!result[sound.category]) {
                    result[sound.category] = [];
                }
                result[sound.category].push(sound);

                return result;
            }, sounds[serverId]);
            for(const category in sounds[serverId]) {
                sounds[serverId][category].sort((soundA, soundB) => soundA.fileName.localeCompare(soundB.fileName));
            }
            this._sounds.next(sounds);
        })
    }

    public loadServers() {
        this.apiService.getServers().subscribe(newServers => {
            this._servers.next(newServers);
        })
    }

    public loadChannels(serverId: string) {
        this.apiService.getChannels(serverId).subscribe(newChannels => {
            const channels = this._channels.getValue();
            channels[serverId] = newChannels;
            this._channels.next(channels);
        })
    }

    public deleteSound(soundId: string): Observable<any> {
        return this.apiService.deleteSound(soundId);
    }

    public downloadSound(soundId: string): Observable<HttpResponse<ArrayBuffer>> {
        return this.apiService.downloadSound(soundId);
    }

    public stopPlaying(serverId: string): Observable<any> {
        return this.apiService.stopPlaying(serverId);
    }

    public setIntro(soundId: string, serverId: string): Observable<any> {
        return this.apiService.setIntro(soundId, serverId);
    }
}