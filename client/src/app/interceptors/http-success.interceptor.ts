import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { tap } from 'rxjs/operators';
import { ToastTitles } from '../models/ToastTitles';

@Injectable({
  providedIn: 'root'
})
export class HttpSuccessInterceptor implements HttpInterceptor {

  constructor(private readonly toast: ToastrService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        tap(response => {
          if(response instanceof HttpResponse && response.statusText) {
            this.toast.success(response.statusText, ToastTitles.SUCCESS);
          }
        })
      );
  }
}