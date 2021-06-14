import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  private readonly _hasAdminServerInterval = 30*60*1000;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  public hasAdminServers$?: Observable<boolean>;
  
  public get userPayload(): UserPayload | undefined {
    return this.storageService.payload;
  }

  constructor(private readonly dataService: DataService, private readonly authService: AuthService, private storageService: StorageService) {}

  public ngOnInit(): void {
    this.hasAdminServers$ = this.dataService.hasAdminServers;

    timer(0, this._hasAdminServerInterval).pipe(takeUntil(this.destroyed$)).subscribe(() => {
      this.dataService.setHasAdminServers();
    });
  }

  public isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  public logout(): void {
    this.dataService.logout();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
