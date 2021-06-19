import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { ServerSettings } from 'src/app/models/ServerSettings';
import { Sounds } from 'src/app/models/Sounds';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent {
  public readonly serverSettings$: Observable<ServerSettings>;
  public readonly sounds$: Observable<Sounds | undefined>;
  public readonly selectedServer$: Observable<Server | undefined>;
  
  constructor(private readonly dataService: DataService) {
    this.sounds$ = this.dataService.sounds;
    this.selectedServer$ = this.dataService.selectedServer;
    this.serverSettings$ = this.selectedServer$
      .pipe(
        filter((selectedServer?: Server): selectedServer is Server => !!selectedServer),
        switchMap(selectedServer => this.dataService.getServerSettings(selectedServer.id))
      );
  }

  public updateServerInfo(serverSettings: ServerSettings) {
    this.dataService.updateServerSettings(serverSettings).subscribe();
  }
}
