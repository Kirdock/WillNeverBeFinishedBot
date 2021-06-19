import { Component, OnDestroy } from '@angular/core';
import { Observable, of, Subject} from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { Sounds } from 'src/app/models/Sounds';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnDestroy {
  public userIntro: string | undefined;
  public cacheIntroBefore: string | undefined;
  public selectedServer$: Observable<Server | undefined>;
  public readonly sounds$: Observable<Sounds | undefined>;
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
    this.dataService.updateIntro(soundId, serverId).subscribe(()=>{
      this.userIntro = soundId;
    },() => {
      this.userIntro = this.cacheIntroBefore;
    });
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
