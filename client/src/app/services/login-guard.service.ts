import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardService implements CanActivate {

  constructor(public auth: AuthService, public router: Router) {}

  public canActivate(): boolean {
    return !this.auth.isAuthenticated();
  }
}