import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { Sounds } from 'src/app/models/Sounds';
import { User } from 'src/app/models/User';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  public servers: Server[] = [];
  public selectedServerId?: string;
  public cacheIntroBefore: string | undefined;
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;
  public userIntro?: string;
  private readonly destroyed$: Subject<void> = new Subject<void>();

  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.sounds
    .pipe(takeUntil(this.destroyed$))
    .subscribe(sounds => {
      this.sounds = sounds;
    });

    this.dataService.servers.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      if(!this.selectedServerId) {
        this.selectedServerId = this.servers.find(_ => true)?.id;
        this.selectedServerChanged();
      }
    });

    this.dataService.loadServers();
  }

  public selectedServerChanged() {
    if(this.selectedServerId) {
      this.dataService.loadSounds(this.selectedServerId);
      this.dataService.getUserIntro(this.selectedServerId).subscribe(userIntro => {
        this.userIntro = userIntro;
      });
    }
  }

  public updateIntro(soundId?: string) {
    if(this.selectedServerId) {
      this.dataService.updateIntro(soundId, this.selectedServerId).subscribe();
    }
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
