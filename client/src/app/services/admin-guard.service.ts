import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { Observable } from "rxjs";
import { DataService } from "./data.service";

@Injectable({
    providedIn: 'root'
  })
export class AdminGuardService implements CanActivate {

    constructor(private readonly dataService: DataService) {}

    canActivate(): Observable<boolean> {
        return this.dataService.hasAdminServers;
    }

}