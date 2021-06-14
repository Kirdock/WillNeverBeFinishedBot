import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuardService } from './services/admin-guard.service';
import { AuthGuardService } from './services/auth-guard.service';
import { LoginComponent } from './views/login/login.component';

const routes: Routes = [
  {path: '/Login', component: LoginComponent},
  {path: '/', component: LoginComponent, canActivate: [AuthGuardService]},
  {path: '/Account', component: LoginComponent, canActivate: [AuthGuardService]},
  {path: '/Admin', component: LoginComponent, canActivate: [AdminGuardService]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
