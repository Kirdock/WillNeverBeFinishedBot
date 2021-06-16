import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Location} from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ToastTitles } from '../models/ToastTitles';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorInterceptor implements HttpInterceptor {
  private isReloading = false;

  constructor(private readonly router: Router, private readonly toast: ToastrService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.toast.error(error.error?.message ?? error.message, ToastTitles.ERROR);

          if (error.status === 401 && !this.isReloading) {
            this.isReloading = true;
            
            setTimeout(
              () => this.router.navigate(['/', 'Login']),
              1000
            );
          }

          return throwError(error);
        })
      );
  }
}