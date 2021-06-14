import { HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Category } from 'src/app/models/Category';
import { Channel } from 'src/app/models/Channel';
import { HomeSettings } from 'src/app/models/HomeSettings';
import { PlaySoundRequest } from 'src/app/models/PlaySoundRequest';
import { Server } from 'src/app/models/Server';
import { SoundMeta } from 'src/app/models/SoundMeta';
import { Sounds } from 'src/app/models/Sounds';
import { ToastTitles } from 'src/app/models/ToastTitles';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public servers: Server[] = [];
  public sounds: Sounds | undefined;
  public channels: Channel[] = [];
  public soundCategories: Category[] = [];
  public selectedCategory?: string;
  public maxVolume = 1;
  public youtubeUrl = '';
  public searchText = '';
  public settings: HomeSettings = new HomeSettings();
  public soundPollingInterval = 30 * 1000;
  private destroyed$: Subject<void> = new Subject<void>();
  private serverChanged$: Subject<void> = new Subject<void>();

  public get isOwner(): boolean {
    return this.authService.isOwner();
  }

  public get selectedServerId(): string | undefined {
    return this.settings.selectedServerId;
  }

  public set selectedServerId(serverId: string | undefined) {
    this.settings.selectedServerId = serverId;
    this.saveSettings();
  }

  public get joinUser(): boolean {
    return this.settings.joinUser;
  }

  public set joinUser(joinUser: boolean) {
    this.settings.joinUser = joinUser;
    this.saveSettings();
  }

  public get selectedChannelId(): string | undefined {
    return this.settings.selectedChannelId;
  }

  public set selectedChannelId(channelId: string | undefined) {
    this.settings.selectedServerId = channelId;
    this.saveSettings();
  }

  public get volume(): number {
    return this.settings.volume;
  }

  public set volume(vol: number) {
    this.settings.volume = vol;
    this.saveSettings();
  }

  public get userId(): string | undefined {
    return this.storageService.payload?.id;
  }

  public get filteredSoundCategories(): Category[] {
    return this.soundCategories.filter(category =>{
      return this.filteredSounds(category.name).length > 0;
    });
  }

  constructor(private readonly authService: AuthService, private readonly storageService: StorageService, private readonly dataService: DataService, private readonly toast: ToastrService) { }

  public ngOnInit(): void {
    this.loadSettings();

    if(this.isOwner) {
      this.maxVolume = 1000;
    }

    timer(this.soundPollingInterval, this.soundPollingInterval).pipe(
      switchMap(() => this.serverChanged$),
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      if(this.selectedServerId) {
        this.dataService.loadSounds(this.selectedServerId, new Date());
      }
    });

    this.dataService.sounds.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(newSounds => {
      if(this.selectedServerId) {
        this.sounds = newSounds[this.selectedServerId];
        this.updateSoundCategories(this.sounds);
      }
    });

    this.dataService.servers.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      this.fetchChannels();
      if(this.selectedServerId) {
        if(!this.servers.some(server => server.id === this.selectedServerId)){
          this.selectedServerId = undefined;
        }
        else if(!this.sounds) {
          this.dataService.loadSounds(this.selectedServerId);
        }
      }
    });

    this.dataService.channels.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(channels => {
      if(this.selectedServerId){
        this.channels = channels[this.selectedServerId] ?? [];
        if(this.selectedChannelId && !this.channels.some(channel => channel.id === this.selectedChannelId)) {
          this.selectedChannelId = undefined;
        }
      }
    })

    this.dataService.loadServers();
  }

  private updateSoundCategories(sounds: Sounds): void {
    this.soundCategories = Object.keys(sounds).map(category => {
      return {
        name: category,
        show: !!this.soundCategories.find(cat => cat.name === category)?.show
      };
    });
  }

  public isAdmin(): boolean {
    return this.servers.find(server => server.id === this.selectedServerId)?.isAdmin ?? false;
  }

  public selectedServerChanged(): void {
    this.serverChanged$.next();
    this.fetchChannels();
  }

  public fetchChannels(): void {
    if(this.selectedServerId) {
      this.dataService.loadChannels(this.selectedServerId);
    }
  }

  public loadSettings(): void {
    this.settings = this.storageService.settings;
  }

  public saveSettings(): void {
    this.storageService.settings = this.settings;
  }

  public submitFile(files: FileList | null): void {
    if(files && this.selectedCategory && this.selectedServerId) {
      this.dataService.submitFile(files, this.selectedCategory, this.selectedServerId).subscribe(() => {
        //maybe show a loading-spinner
      });
    }
  }

  public setCategoriesVisibility(status: boolean): void {
    for(const category of this.soundCategories) {
      category.show = status;
    }
  }

  public playSound(soundId?: string, forcePlay = false): void {
    if(this.selectedServerId && this.selectedChannelId && (soundId || this.youtubeUrl)) {
      const request = new PlaySoundRequest(
          soundId,
          forcePlay,
          this.selectedServerId,
          this.selectedChannelId,
          this.volume,
          this.joinUser,
          this.youtubeUrl
        );
      this.dataService.playSound(request);
    }
  }

  public playFile(soundId: string, audioElement: HTMLAudioElement): void {
    if(!audioElement.src){
      this.dataService.downloadSound(soundId).subscribe(response =>{
        try{
          audioElement.pause();
          audioElement.src = URL.createObjectURL(response.body);
          audioElement.title = this.getFileNameOutOfHeader(response.headers);
          audioElement.play();
        }
        catch{
          this.toast.error(`Konn de Datei nit obspüln\nFormat weat onscheinend nit unterstützt`, ToastTitles.ERROR);
        }
      });
    }
  }

  public downloadSound(soundId: string, audioElement: HTMLAudioElement): void {
    if(audioElement.src) {
      this.downloadFile(audioElement.src, audioElement.title);
    }
    else {
      this.dataService.downloadSound(soundId).subscribe(response => {
        if(response.body) {
          this.downloadFile(response.body, this.getFileNameOutOfHeader(response.headers));
        }
        else {
          this.toast.error('Konnst du ma bitte sogn, warum i jetz nix hinta kriag hob?', ToastTitles.ERROR);
        }
      })
    }
  }

  private downloadFile(data: ArrayBuffer | string, fileName: string) {
    const url: string = data instanceof ArrayBuffer ? window.URL.createObjectURL(data) : data;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
  }

  private getFileNameOutOfHeader(headers: HttpHeaders){
    let fileName = '';
    const disposition = headers.get('content-disposition');
    if (disposition?.includes('attachment')) {
        const reg = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = reg.exec(disposition);
        if (matches?.[1]) { 
          fileName = matches[1].replace(/['"]/g, '');
        }
    }
    return fileName;
  }

  public stopPlaying(): void {
    if(this.selectedServerId) {
      this.dataService.stopPlaying(this.selectedServerId).subscribe(() => {
      });
    }
  }

  public setIntro(soundId: string) {
    if(this.selectedServerId) {
      this.dataService.updateIntro(soundId, this.selectedServerId).subscribe(() => {
      });
    }
  }

  public deleteSound(soundId: string, category: string): void {
    this.dataService.deleteSound(soundId).subscribe(() => {
      if(this.sounds)  {
        const index = this.sounds[category]?.findIndex(sound => sound._id === soundId);
        if(index >= 0) {
          this.sounds[category].splice(index, 1);
        }
      }
    });
  }

  public filteredSounds(category: string): SoundMeta[]{
    let sounds: SoundMeta[];
    if(this.sounds) {
      if(this.searchText.length > 0){
        const re = new RegExp(this.searchText,'i');
        sounds = this.sounds[category].filter(sound => re.test(sound.fileName) || (sound.username && re.test(sound.username)));
      }
      else{
        sounds = this.sounds[category];
      }
    }
    else {
      sounds = [];
    }
    return sounds;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
