import { Injectable } from "@angular/core";
import { StorageService } from "./storage.service";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private readonly storageService: StorageService) {}

    public isAuthenticated(): boolean {
        return !!this.storageService.token;
    }

    public isOwner(): boolean {
        return this.storageService.payload?.isSuperAdmin ?? false;
    }
}