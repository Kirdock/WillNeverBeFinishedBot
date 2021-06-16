import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { Log } from 'src/app/models/Log';
import { Server } from 'src/app/models/Server';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-server-log-list',
  templateUrl: './server-log-list.component.html',
  styleUrls: ['./server-log-list.component.scss']
})
export class ServerLogListComponent implements OnInit, OnDestroy {
  public servers: Server[] = [];
  public logs: Log[] = [];
  public readonly logInterval = 30 * 1000;
  public selectedServerId?: string;
  public readonly pageSize = 50;
  public pageKey = 0;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  private readonly selectedServerChanged$: Subject<void> = new Subject<void>();

  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.servers.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      if(!this.selectedServerId || !this.servers.some(server => server.id === this.selectedServerId))
        this.selectedServerId = this.servers.find(()=> true)?.id;
        this.selectedServerChanged$.next();
    });

    this.selectedServerChanged$.pipe(
      tap(() => {
        if(this.selectedServerId) {
          this.dataService.getLogs(this.selectedServerId, this.pageSize, this.pageKey).subscribe(logs => {
            this.logs = logs;
          });
        }
      }),
      switchMap( () => timer(this.logInterval, this.logInterval)),
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      if(this.selectedServerId) {
        this.dataService.getLogs(this.selectedServerId, undefined, undefined, new Date()).subscribe(logs => {
          this.logs = logs;
        });
      }
    });
  }

  public selectedServerChanged() {
    this.selectedServerChanged$.next();
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
