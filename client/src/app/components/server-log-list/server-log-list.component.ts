import { Component, OnDestroy, OnInit } from '@angular/core';
import { of, Subject, timer } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { ILog } from 'src/app/interfaces/Log';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-server-log-list',
  templateUrl: './server-log-list.component.html',
  styleUrls: ['./server-log-list.component.scss']
})
export class ServerLogListComponent implements OnInit, OnDestroy {
  public logs: ILog[] = [];
  public pageKey = 0;
  public readonly pageSize = 50;
  private readonly logInterval = 30 * 1000;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  private _logFetchTime: Date = new Date();

  constructor(private readonly dataService: DataService) {
  }

  public ngOnInit(): void {
    this.dataService.selectedServer
      .pipe(
        switchMap(selectedServer => {
          const logs$ = selectedServer ? this.dataService.getLogs(selectedServer.id, this.pageSize, this.pageKey) : of([])
          this._logFetchTime = new Date();
          return logs$
            .pipe(
              tap(logs => {
                this.logs = logs;
              }),
              switchMap(() => timer(this.logInterval, this.logInterval)),
              switchMap(() => {
                const fromTime = this._logFetchTime;
                this._logFetchTime = new Date();
                return selectedServer ? this.dataService.getLogs(selectedServer.id, this.pageSize, this.pageKey, fromTime) : []
              })
            );
        }),
        takeUntil(this.destroyed$)
      ).subscribe(logs => {
      this.logs = logs;
    })
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
