import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
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
  public selectedServer: Server | undefined;
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
      this.selectedServer = this.servers.find(()=> true);
      if(this.selectedServer) {
        this.dataService.getLogs(this.selectedServer.id, this.pageSize, this.pageKey).subscribe(logs => {
          this.logs = logs;
        });
      }
    });

    timer(this.logInterval, this.logInterval).pipe(
      switchMap(() => this.selectedServerChanged$),
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      if(this.selectedServer) {
        this.dataService.getLogs(this.selectedServer.id, undefined, undefined, new Date()).subscribe(logs => {
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
