import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { Observable } from "rxjs";
import { DataService } from "./data.service";

@Injectable({
    providedIn: 'root'
  })
export class AdminGuardService implements CanActivate {
    private hasAdminServers$: Observable<boolean>;
    constructor(private readonly dataService: DataService) {
        this.hasAdminServers$ = this.dataService.hasAdminServers;
    }

    canActivate(): Observable<boolean> {
        return this.hasAdminServers$;
    }

}