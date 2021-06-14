import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserIntrosComponent } from './user-intros.component';

describe('UserIntrosComponent', () => {
  let component: UserIntrosComponent;
  let fixture: ComponentFixture<UserIntrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserIntrosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserIntrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
