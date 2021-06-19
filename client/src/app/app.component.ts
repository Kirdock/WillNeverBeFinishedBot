import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { filter, map, skip, skipWhile, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { Server } from './models/Server';
import { UserPayload } from './models/UserPayload';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _updateInterval = 30 * 1000;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  public readonly hasAdminServers$: Observable<boolean>;
  public readonly servers$: Observable<Server[]>;
  private _selectedServer: Server | undefined;
  
  public get userPayload(): UserPayload | undefined {
    return this.storageService.payload;
  }

  public get isLoggedIn() {
    return this.authService.isAuthenticated();
  }

  public get addServerLink() {
    return this.dataService.addServerLink;
  }

  public get selectedServer(): Server | undefined {
    return this._selectedServer;
  }

  public set selectedServer(server: Server | undefined) {
    this._selectedServer = server;
    this.storageService.settings.selectedServerId = server?.id;
    this.dataService.setSelectedServer(server);
  }

  constructor(private readonly dataService: DataService, private readonly authService: AuthService, private storageService: StorageService) {
    this.servers$ = this.dataService.servers;
    this.hasAdminServers$ = this.dataService.hasAdminServers;
  }

  public ngOnInit(): void {
    this.update();
    if (this.storageService.settings.selectedServerId) { // load settings
      this.servers$
        .pipe(
          takeUntil(this.destroyed$),
          skipWhile(servers => servers.length === 0),
          take(1),
        ).subscribe(servers => {
          this.selectedServerChanged(servers.find(server => server.id === this.storageService.settings.selectedServerId) || servers.find(() => true));
        });
    }
    this.dataService.selectedServer
      .pipe(
        takeUntil(this.destroyed$),
        filter((server?: Server): server is Server => !!server),
        map(server => server.id),
        tap(serverId => this.dataService.loadSounds(serverId)),
        switchMap(serverId => timer(this._updateInterval, this._updateInterval).pipe(map((()=> serverId)))),
        takeUntil(this.destroyed$)
      ).subscribe(serverId => {
        if(this.isLoggedIn) {
          this.dataService.loadSounds(serverId, true);
        }
      });

    timer(this._updateInterval, this._updateInterval)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.update();
    });
  }

  public getFilteredServers(servers: Server[], selectedServer: Server | undefined): Server[] {
    return selectedServer ? servers.filter(server => server.id !== selectedServer.id) : servers;
  }

  private update(): void {
    if(this.isLoggedIn) {
      this.dataService.loadServers();
      this.dataService.setHasAdminServers();
    }
  }

  public selectedServerChanged(server: Server | undefined) {
    this.selectedServer = server;
  }

  public logout(): void {
    this.dataService.logout();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}