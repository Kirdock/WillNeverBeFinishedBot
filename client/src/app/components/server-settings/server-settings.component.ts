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
  public selectedServer: Server | undefined;
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  
  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.servers.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      if(!this.selectedServer) {
        this.selectedServer = this.servers.find(() => true);
        this.selectedServerChanged();
      }
    });
  }

  public selectedServerChanged() {
    if(this.selectedServer) {
      this.dataService.getServerSettings(this.selectedServer.id).subscribe(serverSettings => {
        this.serverSettings = serverSettings;
      });
    }
  }

  public updateServerInfo() {
    this.dataService.updateServerSettings(this.serverSettings);
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
