import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ICategory } from 'src/app/interfaces/Category';
import { IChannel } from 'src/app/interfaces/Channel';
import { IServer } from 'src/app/interfaces/IServer';
import { ToastTitles } from 'src/app/models/ToastTitles';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { StorageService } from 'src/app/services/storage.service';
import { IHomeSettings } from '../../interfaces/home-settings';
import { createHomeSettings } from '../../utils/HomeSettings';
import { IPlaySoundRequest } from '../../interfaces/play-sound-request';
import { FileInfo, ISoundMeta, ISounds } from '../../interfaces/sound-meta';
import { setFileInfo } from '../../utils/SoundMeta';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public readonly sounds$: Observable<ISounds | undefined>;
  public readonly selectedServer$: Observable<IServer | undefined>;
  public channels: IChannel[] = [];
  public soundCategories: ICategory[] = [];
  public selectedCategory?: string;
  public youtubeUrl = '';
  public searchText = '';
  public settings: IHomeSettings = createHomeSettings();
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

  public get recordVoiceMinutes(): number {
    return this.settings.recordVoiceMinutes;
  }

  public set recordVoiceMinutes(minutes: number) {
    this.settings.recordVoiceMinutes = minutes;
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

  public filteredSoundCategories(sounds: ISounds): ICategory[] {
    return this.soundCategories.filter((category: ICategory) => {
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
        filter((server?: IServer): server is IServer => !!server)
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
      if (!this.selectedChannelId || !this.channels.some((channel: IChannel) => channel.id === this.selectedChannelId)) {
        this.selectedChannelId = channels.find(_ => true)?.id;
      }
    });
  }

  public downloadRecordedVoice(serverId: string, asMKV: boolean): void {
    this.dataService.downloadRecordedVoice(serverId, asMKV ? 'mkv' : 'audio', this.recordVoiceMinutes).subscribe((response) => {
      if (response.body) {
        this.downloadFileByBlob(response.body, response.headers);
      } else {
        this.toast.error('Konnst du ma bitte sogn, warum i jetz nix hinta kriag hob?', ToastTitles.ERROR);
      }
    });
  }

  private updateSoundCategories(sounds: ISounds | undefined): void {
    this.soundCategories = sounds ? Object.keys(sounds).map((category: string) => {
      return {
        name: category,
        show: this.soundCategories.find(cat => cat.name === category)?.show ?? true
      };
    }) : [];
    this.soundCategories.sort((catA: ICategory, catB: ICategory) => catA.name.localeCompare(catB.name));
    if (!this.selectedCategory || !this.soundCategories.some((category: ICategory) => category.name === this.selectedCategory)) {
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
    if (files && this.selectedCategory) {
      this.dataService.submitFile(files, this.selectedCategory, serverId).subscribe(() => {
        //maybe show a loading-spinner
      });
    }
  }

  public setCategoriesVisibility(status: boolean): void {
    for (const category of this.soundCategories) {
      category.show = status;
    }
  }

  public playSound(serverId: string, sounds?: ISoundMeta[], soundId?: string, forcePlay = false): void {
    if (this.selectedChannelId && (soundId || this.youtubeUrl)) {
      const request: IPlaySoundRequest = {
        soundId,
        forcePlay,
        serverId,
        channelId: this.selectedChannelId,
        volume: this.volume,
        joinUser: this.joinUser,
        url: this.youtubeUrl,
      }
      this.dataService.playSound(request).subscribe(() => {
      }, (error: HttpErrorResponse) => {
        if (error.status === 404 && sounds && soundId) {
          const index = sounds.findIndex(sound => sound._id === soundId);
          if (index >= 0) {
            sounds.splice(index, 1);
          }
        }
      });
    }
  }

  public playFile(sound: ISoundMeta, audioElement: HTMLAudioElement): void {
    if (!sound.fileInfo) {
      this.dataService.downloadSound(sound._id).subscribe(response => {
        try {
          if (!response.body) {
            this.toast.error(`Response is null O.o`, ToastTitles.ERROR);
            return;
          }
          const responseData = this.getResponseData(response.body, response.headers);
          setFileInfo(sound, responseData.src, responseData.fullName);
          audioElement.load();
          audioElement.play();
        } catch {
          this.toast.error(`Konn de Datei nit obspüln\nFormat weat onscheinend nit unterstützt`, ToastTitles.ERROR);
        }
      });
    }
  }

  public downloadSound(sound: ISoundMeta): void {
    if (sound.fileInfo) {
      this.downloadFile(sound.fileInfo.src, sound.fileInfo.fullName);
    } else {
      this.dataService.downloadSound(sound._id).subscribe(response => {
        if (response.body) {
          const responseData = this.getResponseData(response.body, response.headers);
          if (setFileInfo(sound, responseData.src, responseData.fullName)) {
            this.downloadFile(sound.fileInfo.src, sound.fileInfo.fullName);
          }
        } else {
          this.toast.error('Konnst du ma bitte sogn, warum i jetz nix hinta kriag hob?', ToastTitles.ERROR);
        }
      })
    }
  }

  private getResponseData(data: Blob, headers: HttpHeaders): FileInfo {
    return {
      src: URL.createObjectURL(data),
      fullName: this.getFileNameOutOfHeader(headers),
    };
  }

  private getFileNameOutOfHeader(headers: HttpHeaders): string {
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

  public saveUrl(src: string | undefined): SafeUrl | undefined {
    return src ? this.domSanitizer.bypassSecurityTrustUrl(src) : undefined;
  }

  private downloadFile(src: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = src;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private downloadFileByBlob(data: Blob, headers: HttpHeaders): void {
    this.downloadFile(URL.createObjectURL(data), this.getFileNameOutOfHeader(headers));
  }

  public stopPlaying(serverId: string): void {
    this.dataService.stopPlaying(serverId).subscribe();
  }

  public setIntro(serverId: string, soundId: string): void {
    this.dataService.updateIntro(soundId, serverId).subscribe();
  }

  public deleteSound(soundId: string, ISoundMeta: ISoundMeta[]): void {
    this.dataService.deleteSound(soundId).subscribe(() => {
      const index = ISoundMeta.findIndex(sound => sound._id === soundId);
      if (index >= 0) {
        ISoundMeta.splice(index, 1);
      }
    });
  }

  public filteredSounds(sounds: ISoundMeta[]): ISoundMeta[] {
    let filteredSounds: ISoundMeta[];
    if (this.searchText.length > 0) {
      const re = new RegExp(this.searchText, 'i');
      filteredSounds = sounds.filter(sound => re.test(sound.fileName) || (sound.username && re.test(sound.username)));
    } else {
      filteredSounds = sounds;
    }
    return filteredSounds;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  public getSoundIdentifier(_index: number, sound: ISoundMeta): string {
    return sound._id;
  }
}
