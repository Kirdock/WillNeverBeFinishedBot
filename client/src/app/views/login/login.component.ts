import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login-view',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly destroyed$: Subject<void> = new Subject<void>();
  private readonly location = window.location.protocol + '//' + window.location.host + '/Login';

  public get oauthLink(): string {
    return this.dataService.oauthLink;
  }

  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router) { }

  public ngOnInit(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(params => {
      if(params.code) {
        this.dataService.login(params.code, this.location).subscribe(() => {
          this.router.navigate(['/']);
        });
      }
    })
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
