import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
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
  public readonly sounds$: Observable<Sounds | undefined>;
  public readonly selectedServer$: Observable<Server | undefined>;
  public channels: Channel[] = [];
  public soundCategories: Category[] = [];
  public selectedCategory?: string;
  public youtubeUrl = '';
  public searchText = '';
  public settings: HomeSettings = new HomeSettings();
  public soundPollingInterval = 30_000;
  private destroyed$: Subject<void> = new Subject<void>();

  public get isOwner(): boolean {
    return this.authService.isOwner();
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
    this.settings.selectedChannelId = channelId;
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

  public get maxVolume(): number {
    return this.isOwner ? 1000 : 1;
  }

  public filteredSoundCategories(sounds: Sounds): Category[] {
    return this.soundCategories.filter(category =>{
      return this.filteredSounds(sounds[category.name]).length !== 0;
    });
  }

  constructor(private readonly authService: AuthService, private readonly storageService: StorageService, private readonly dataService: DataService, private readonly toast: ToastrService, private domSanitizer: DomSanitizer) {
    this.selectedServer$ = this.dataService.selectedServer;
    this.sounds$ = this.dataService.sounds;
  }

  public ngOnInit(): void {
    this.loadSettings();

    this.selectedServer$
      .pipe(
        takeUntil(this.destroyed$),
        filter((server?: Server): server is Server => !!server)
      ).subscribe((server) => {
        this.selectedChannelId = undefined;
        this.fetchChannels(server.id);
      });

    this.sounds$.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(newSounds => {
      this.updateSoundCategories(newSounds);
    });

    this.dataService.channels.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(channels => {
      this.channels = channels;
      if(!this.selectedChannelId || !this.channels.some(channel => channel.id === this.selectedChannelId)) {
        this.selectedChannelId = channels.find(_ => true)?.id;
      }
    });
  }

  private updateSoundCategories(sounds: Sounds | undefined): void {
    this.soundCategories = sounds ? Object.keys(sounds).map(category => {
      return {
        name: category,
        show: this.soundCategories.find(cat => cat.name === category)?.show ?? true
      };
    }) : [];
    if(!this.selectedCategory || !this.soundCategories.some(category => category.name === this.selectedCategory)) {
      this.selectedCategory = this.soundCategories.find(_ => true)?.name;
    }
  }

  public fetchChannels(serverId: string): void {
    this.dataService.loadChannels(serverId);
  }

  public loadSettings(): void {
    this.settings = this.storageService.settings;
  }

  public saveSettings(): void {
    this.storageService.settings = this.settings;
  }

  public submitFile(files: FileList | null, serverId: string): void {
    if(files && this.selectedCategory) {
      this.dataService.submitFile(files, this.selectedCategory, serverId).subscribe(() => {
        //maybe show a loading-spinner
      });
    }
  }

  public setCategoriesVisibility(status: boolean): void {
    for(const category of this.soundCategories) {
      category.show = status;
    }
  }

  public playSound(serverId: string, sounds?: SoundMeta[], soundId?: string, forcePlay = false): void {
    if(this.selectedChannelId && (soundId || this.youtubeUrl)) {
      const request = new PlaySoundRequest(
          soundId,
          forcePlay,
          serverId,
          this.selectedChannelId,
          this.volume,
          this.joinUser,
          this.youtubeUrl
        );
      this.dataService.playSound(request).subscribe(()=>{}, (error: HttpErrorResponse) => {
        if(error.status === 404 && sounds && soundId) {
          const index = sounds.findIndex(sound => sound._id === soundId);
          if(index >= 0) {
            sounds.splice(index, 1);
          }
        }
      });
    }
  }

  public playFile(sound: SoundMeta, audioElement: HTMLAudioElement): void {
    if(!sound.fileInfo){
      this.dataService.downloadSound(sound._id).subscribe(response =>{
        try{
          sound.setFileInfo(response);
          audioElement.load();
          audioElement.play();
        }
        catch {
          this.toast.error(`Konn de Datei nit obspüln\nFormat weat onscheinend nit unterstützt`, ToastTitles.ERROR);
        }
      });
    }
  }

  public downloadSound(sound: SoundMeta): void {
    if(sound.fileInfo) {
      this.downloadFile(sound);
    }
    else {
      this.dataService.downloadSound(sound._id).subscribe(response => {
        if(response.body) {
          sound.setFileInfo(response);
          this.downloadFile(sound);
        }
        else {
          this.toast.error('Konnst du ma bitte sogn, warum i jetz nix hinta kriag hob?', ToastTitles.ERROR);
        }
      })
    }
  }

  public saveUrl(src: string | undefined): SafeUrl | undefined {
    return src ? this.domSanitizer.bypassSecurityTrustUrl(src) : undefined;
  }

  private downloadFile(sound: SoundMeta): void {
    const link = document.createElement('a');
    link.href = sound.fileInfo!.src;
    link.setAttribute('download', sound.fileInfo!.fullName!);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  public stopPlaying(serverId: string): void {
      this.dataService.stopPlaying(serverId).subscribe();
  }

  public setIntro(serverId: string, soundId: string): void {
    this.dataService.updateIntro(soundId, serverId).subscribe();
  }

  public deleteSound(soundId: string, soundMeta: SoundMeta[]): void {
    this.dataService.deleteSound(soundId).subscribe(() => {
      const index = soundMeta.findIndex(sound => sound._id === soundId);
      if(index >= 0) {
        soundMeta.splice(index, 1);
      }
    });
  }

  public filteredSounds(sounds: SoundMeta[]): SoundMeta[] {
    let filteredSounds: SoundMeta[];
    if(this.searchText.length > 0){
      const re = new RegExp(this.searchText,'i');
      filteredSounds = sounds.filter(sound => re.test(sound.fileName) || (sound.username && re.test(sound.username)));
    }
    else{
      filteredSounds = sounds;
    }
    return filteredSounds;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
