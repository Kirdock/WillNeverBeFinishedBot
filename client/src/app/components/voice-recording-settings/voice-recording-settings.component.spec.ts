import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceRecordingSettingsComponent } from './voice-recording-settings.component';

describe('VoiceRecordingSettingsComponent', () => {
  let component: VoiceRecordingSettingsComponent;
  let fixture: ComponentFixture<VoiceRecordingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoiceRecordingSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceRecordingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
