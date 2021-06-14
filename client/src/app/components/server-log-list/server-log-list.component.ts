import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { UserServerInformation } from 'src/app/models/UserServerInformation';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-server-log-list',
  templateUrl: './server-log-list.component.html',
  styleUrls: ['./server-log-list.component.scss']
})
export class ServerLogListComponent implements OnInit, OnDestroy {
  public servers: UserServerInformation[] = [];
  public logs: Log[] = [];
  public readonly logInterval = 30 * 1000;
  public selectedServer: Server | undefined;
  private readonly destroyed$: Subject<void> = new Subject<void>();

  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.logs = this.dataService.logs.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(allLogs => {
      if(this.selectedServer){
        this.logs = allLogs[this.selectedServer.id];
      }
    })

    this.dataService.servers.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      this.selectedServer = this.servers.find(()=> true);
      if(this.selectedServer) {
        this.dataService.loadLogs(this.selectedServer.id);
      }
    });

    timer(this.logInterval, this.logInterval).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      if(this.selectedServer) {
        this.destroyed$.loadLogs(this.selectedServer.id, new Date());
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
