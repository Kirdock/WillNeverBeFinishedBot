import { NgModule } from '@angular/core';
import { AccountComponent } from './account.component';
import { AsyncPipe, KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { AccountRoutingModule } from './account-routing.module';

@NgModule({
  declarations: [AccountComponent],
  imports: [
    AsyncPipe,
    FormsModule,
    KeyValuePipe,
    RouterLinkWithHref,
    NgIf,
    NgForOf,
    AccountRoutingModule
  ]
})
export class AccountModule {
}
