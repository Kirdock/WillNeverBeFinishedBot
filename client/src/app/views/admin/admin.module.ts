import { NgModule } from '@angular/core';
import { UserIntrosComponent } from '../../components/user-intros/user-intros.component';
import { ServerLogListComponent } from '../../components/server-log-list/server-log-list.component';
import { ServerSettingsComponent } from '../../components/server-settings/server-settings.component';
import { VoiceRecordingSettingsComponent } from '../../components/voice-recording-settings/voice-recording-settings.component';
import { AdminComponent } from './admin.component';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe, KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { RouterLinkWithHref } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FlexModule } from '@angular/flex-layout';
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [
    UserIntrosComponent,
    ServerLogListComponent,
    ServerSettingsComponent,
    VoiceRecordingSettingsComponent,
    AdminComponent,
  ],
  imports: [
    MatTabsModule,
    FormsModule,
    AsyncPipe,
    RouterLinkWithHref,
    KeyValuePipe,
    DatePipe,
    NgIf,
    NgForOf,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    FlexModule,
    AdminRoutingModule
  ],
})
export class AdminModule {
}
