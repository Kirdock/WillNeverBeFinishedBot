import { Component, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { IServer } from 'src/app/interfaces/IServer';
import { DataService } from 'src/app/services/data.service';
import { ISounds } from '../../interfaces/sound-meta';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnDestroy {
  public userIntro: string | undefined;
  public cacheIntroBefore: string | undefined;
  public selectedServer$: Observable<IServer | undefined>;
  public readonly sounds$: Observable<ISounds | undefined>;
  private readonly destroyed$: Subject<void> = new Subject<void>();

  constructor(private readonly dataService: DataService) {
    this.sounds$ = this.dataService.sounds;
    this.selectedServer$ = this.dataService.selectedServer;
    this.selectedServer$.pipe(
      switchMap(selectedServer => selectedServer ? this.dataService.getUserIntro(selectedServer.id) : of(undefined)),
      takeUntil(this.destroyed$)
    ).subscribe(intro => {
      this.userIntro = intro;
    });
  }

  public updateIntro(serverId: string, soundId?: string) {
    this.dataService.updateIntro(soundId, serverId).subscribe(() => {
      this.userIntro = soundId;
    }, () => {
      this.userIntro = this.cacheIntroBefore;
    });
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
