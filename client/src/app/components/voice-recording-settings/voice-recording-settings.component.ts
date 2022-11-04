import { Component } from '@angular/core';
import { IUserVoiceSettings } from '../../../../../shared/interfaces/user-voice-settings';
import { DataService } from '../../services/data.service';
import { finalize, map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-voice-recording-settings',
  templateUrl: './voice-recording-settings.component.html',
  styleUrls: ['./voice-recording-settings.component.scss']
})
export class VoiceRecordingSettingsComponent {
  public readonly dataSource: Observable<IUserVoiceSettings[]>;
  public readonly selectedServerId$: Observable<string | undefined>;
  public readonly columns: string[] = ['username', 'volume'];
  public readonly updatingUserVolumes: Record<string, undefined | boolean> = {};

  constructor(private readonly dataService: DataService) {
    this.selectedServerId$ = dataService.selectedServer.pipe(map(server => server?.id));
    this.dataSource = dataService.selectedServer.pipe(
      switchMap(selectedServer => selectedServer ? dataService.getUserVoiceSettings(selectedServer.id) : of([])),
    )
  }

  public toUser(row: unknown): IUserVoiceSettings {
    return row as IUserVoiceSettings;
  }

  public updateUserVolume(serverId: string, userId: string, volume: number): void {
    this.updatingUserVolumes[userId] = true;
    this.dataService.updateUserVolume(serverId, userId, volume).pipe(finalize(() => {
      this.updatingUserVolumes[userId] = false;
    })).subscribe(() => {

    });
  }

}
