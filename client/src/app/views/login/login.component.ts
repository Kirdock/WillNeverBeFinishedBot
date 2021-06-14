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
  private destroyed$: Subject<void> = new Subject<void>();

  public get oauthLink(): string {
    return `https://discord.com/api/oauth2/authorize?client_id=${environment.clientId}&redirect_uri=${this.getLocation()}&response_type=code&scope=identify`;
  }

  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router) { }

  public ngOnInit(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(params => {
      if(params.code) {
        this.dataService.login(params.code, this.getLocation()).subscribe(() => {
          this.router.navigate(['/']);
        });
      }
    })
  }

  private getLocation(): string{
    return this.router.url;
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
