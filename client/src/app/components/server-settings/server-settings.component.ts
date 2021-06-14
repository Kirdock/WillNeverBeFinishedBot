import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServerSettings } from 'src/app/models/ServerSettings';
import { Sounds } from 'src/app/models/Sounds';
import { UserServerInformation } from 'src/app/models/UserServerInformation';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent implements OnInit, OnDestroy {
  public servers: UserServerInformation[] = [];
  public selectedServer: ServerSettings = new ServerSettings();
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  
  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.serversSettings.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      
    });

    this.dataService.loadServerSettings();
  }

  public updateServerInfo() {
    this.dataService.updateServerInfo();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
