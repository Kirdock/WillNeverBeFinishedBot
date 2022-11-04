import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuardService } from './services/guards/admin-guard.service';
import { AuthGuardService } from './services/guards/auth-guard.service';
import { LoginPageGuardService } from './services/guards/loginPage-guard.service';

const routes: Routes = [
  {path: '', pathMatch: 'full', loadChildren: () => import('./views/home/home.module').then(module => module.HomeModule), canActivate: [AuthGuardService]},
  {path: 'Login', loadChildren: () => import('./views/login/login.module').then(module => module.LoginModule), canActivate: [LoginPageGuardService]},
  {path: 'Account', loadChildren: () => import('./views/account/account.module').then(module => module.AccountModule), canActivate: [AuthGuardService]},
  {path: 'Admin', loadChildren: () => import('./views/admin/admin.module').then(module => module.AdminModule), canActivate: [AdminGuardService]},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
