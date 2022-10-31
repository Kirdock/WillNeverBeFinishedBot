import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccountComponent } from './views/account/account.component';
import { AdminComponent } from './views/admin/admin.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HttpSuccessInterceptor } from './interceptors/http-success.interceptor';
import { HttpDefaultInterceptor } from './interceptors/http-default.interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { UserIntrosComponent } from './components/user-intros/user-intros.component';
import { ServerLogListComponent } from './components/server-log-list/server-log-list.component';
import { ServerSettingsComponent } from './components/server-settings/server-settings.component';
import { FlexModule } from '@angular/flex-layout';
import { MatInputModule } from '@angular/material/input';
import { VoiceRecordingSettingsComponent } from './components/voice-recording-settings/voice-recording-settings.component';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    AdminComponent,
    AccountComponent,
    UserIntrosComponent,
    ServerLogListComponent,
    ServerSettingsComponent,
    VoiceRecordingSettingsComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ToastrModule.forRoot({
      timeOut: 5000
    }),
    BrowserAnimationsModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonModule,
    FlexModule,
    MatInputModule,
    MatTableModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpDefaultInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpSuccessInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
