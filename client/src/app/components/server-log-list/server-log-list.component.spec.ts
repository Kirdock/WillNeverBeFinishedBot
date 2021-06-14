import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ServerLogListComponent } from './server-log-list.component';

describe('ServerLogListComponent', () => {
  let component: ServerLogListComponent;
  let fixture: ComponentFixture<ServerLogListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerLogListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerLogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
