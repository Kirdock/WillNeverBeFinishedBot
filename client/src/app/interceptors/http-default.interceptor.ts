import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import { StorageService } from "../services/storage.service";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class HttpDefaultInterceptor implements HttpInterceptor {
    private readonly baseUrl = environment.baseUrl;

    constructor(private storageService: StorageService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authReq = request.clone({
            url: `${this.baseUrl}/${request.url}`,
            headers: request.headers
                .set('Authorization', `Bearer ${this.storageService.token}`)
            });
        return next.handle(authReq);
    }
}