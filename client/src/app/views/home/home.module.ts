import { NgModule } from '@angular/core';
import { HomeComponent } from './home.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { RouterLinkWithHref } from '@angular/router';
import { HomeRoutingModule } from './home-routing.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    FormsModule,
    MatInputModule,
    MatAutocompleteModule,
    AsyncPipe,
    RouterLinkWithHref,
    NgIf,
    NgForOf,
    HomeRoutingModule
  ]
})
export class HomeModule {
}
