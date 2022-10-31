import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { filter, map, skipWhile, takeUntil } from 'rxjs/operators';
import { IServer } from './interfaces/IServer';
import { IUserPayload } from './interfaces/UserPayload';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _updateInterval = 30_000;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  public readonly hasAdminServers$: Observable<boolean>;
  public readonly servers$: Observable<IServer[]>;
  private _selectedServer: IServer | undefined;

  public get userPayload(): IUserPayload | undefined {
    return this.storageService.payload;
  }

  public get isLoggedIn() {
    return this.authService.isAuthenticated();
  }

  public get addServerLink() {
    return this.dataService.addServerLink;
  }

  public get selectedServer(): IServer | undefined {
    return this._selectedServer;
  }

  public set selectedServer(server: IServer | undefined) {
    if (server?.id !== this._selectedServer?.id) {
      this._selectedServer = server;
      this.storageService.settings.selectedServerId = server?.id;
      this.dataService.setSelectedServer(server);
    }
  }

  constructor(private readonly dataService: DataService, private readonly authService: AuthService, private storageService: StorageService) {
    this.servers$ = this.dataService.servers;
    this.hasAdminServers$ = this.dataService.hasAdminServers;
  }

  public ngOnInit(): void {
    this.servers$
      .pipe(
        takeUntil(this.destroyed$),
        skipWhile(servers => servers.length === 0),
      ).subscribe(servers => {
      this.selectedServer = servers.find(server => server.id === this.storageService.settings.selectedServerId) || servers.find(() => true);
    });
    this.dataService.selectedServer
      .pipe(
        filter((server?: IServer): server is IServer => !!server),
        map(server => server.id),
        skipWhile(() => !this.isLoggedIn),
        takeUntil(this.destroyed$)
      ).subscribe(serverId => {
      this.dataService.loadSounds(serverId);
    });

    timer(0, this._updateInterval)
      .pipe(
        takeUntil(this.destroyed$),
        skipWhile(() => !this.isLoggedIn),
      ).subscribe(() => {
      this.dataService.update();
    });
  }

  public getFilteredServers(servers: IServer[], selectedServer: IServer | undefined): IServer[] {
    return selectedServer ? servers.filter(server => server.id !== selectedServer.id) : servers;
  }

  public logout(): void {
    this.dataService.logout();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
