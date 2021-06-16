import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuardService } from './services/admin-guard.service';
import { AuthGuardService } from './services/auth-guard.service';
import { AccountComponent } from './views/account/account.component';
import { AdminComponent } from './views/admin/admin.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';

const routes: Routes = [
  {path: '', pathMatch: 'full', component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'Login', component: LoginComponent},
  {path: 'Account', component: AccountComponent, canActivate: [AuthGuardService]},
  {path: 'Admin', component: AdminComponent, canActivate: [AdminGuardService]},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
