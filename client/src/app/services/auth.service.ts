import { StorageService } from "./storage.service";

export class AuthService {
    constructor(private readonly storageService: StorageService) {}

    public isAuthenticated(): boolean {
        return !!this.storageService.token;
    }

    public isOwner(): boolean {
        return this.storageService.payload?.isSuperAdmin ?? false;
    }
}