import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { IServer } from 'src/app/interfaces/IServer';
import { Sounds } from 'src/app/models/Sounds';
import { DataService } from 'src/app/services/data.service';
import { IServerSettings } from '../../../../../shared/interfaces/server-settings';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent {
  public readonly serverSettings$: Observable<IServerSettings>;
  public readonly sounds$: Observable<Sounds | undefined>;
  public readonly selectedServer$: Observable<IServer | undefined>;

  constructor(private readonly dataService: DataService) {
    this.sounds$ = this.dataService.sounds;
    this.selectedServer$ = this.dataService.selectedServer;
    this.serverSettings$ = this.selectedServer$
      .pipe(
        filter((selectedServer?: IServer): selectedServer is IServer => !!selectedServer),
        switchMap(selectedServer => this.dataService.getServerSettings(selectedServer.id))
      );
  }

  public updateServerInfo(serverSettings: IServerSettings) {
    this.dataService.updateServerSettings(serverSettings).subscribe();
  }
}
