import { Component } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { Sounds } from 'src/app/models/Sounds';
import { User } from 'src/app/models/User';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-user-intros',
  templateUrl: './user-intros.component.html',
  styleUrls: ['./user-intros.component.scss']
})
export class UserIntrosComponent {
  public searchText: string = '';
  public readonly users$: Observable<User[]>;
  public cacheIntroBefore?: string;
  public readonly sounds$: Observable<Sounds | undefined>;
  private readonly destroyed$: Subject<void> = new Subject<void>();
  public readonly selectedServer$: Observable<Server | undefined>;

  public getFilteredUsers(allUsers: User[]) {
    let users;
    if(this.searchText.length > 0){
      const re = new RegExp(this.searchText,'i');
      users = allUsers.filter(user => user.username && re.test(user.username));
    }
    else{
      users = allUsers;
    }
    return users;
  }

  constructor(private readonly dataService: DataService) {
    this.sounds$ = this.dataService.sounds;
    this.selectedServer$ = this.dataService.selectedServer;
    this.users$ = this.selectedServer$
    .pipe(
      takeUntil(this.destroyed$),
      switchMap(selectedServer => selectedServer ? this.dataService.getUsersData(selectedServer.id) : of([]))
    );
  }

  public updateIntro(user: User, serverId: string, soundId: string | undefined) {
    this.dataService.updateIntro(soundId, serverId, user.id).subscribe(() => {
      user.intros[serverId] = soundId;
    }, () => {
      user.intros[serverId] = this.cacheIntroBefore;
    });
  }
}
