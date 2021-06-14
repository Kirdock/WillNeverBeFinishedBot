import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly serverInterval = 30 * 1000;
  private readonly destroyed$: Subject<void> = new Subject<void>();

  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    timer(0, this.serverInterval).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.dataService.loadServers();
    })
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
