import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { ServerSettings } from 'src/app/models/ServerSettings';
import { Sounds } from 'src/app/models/Sounds';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent implements OnInit, OnDestroy {
  public servers: Server[] = [];
  public serverSettings: ServerSettings = new ServerSettings();
  public selectedServerId?: string;
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;
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
      if(!this.selectedServerId || !this.servers.some(server => server.id === this.selectedServerId)) {
        this.selectedServerId = this.servers.find(() => true)?.id;
        this.selectedServerChanged();
      }
    });
  }

  public selectedServerChanged() {
    if(this.selectedServerId) {
      this.dataService.getServerSettings(this.selectedServerId).subscribe(serverSettings => {
        this.serverSettings = serverSettings;
      });
      this.dataService.loadSounds(this.selectedServerId);
    }
  }

  public updateServerInfo() {
    this.dataService.updateServerSettings(this.serverSettings).subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
