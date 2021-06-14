import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Server } from 'src/app/models/Server';
import { Sounds } from 'src/app/models/Sounds';
import { User } from 'src/app/models/User';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-user-intros',
  templateUrl: './user-intros.component.html',
  styleUrls: ['./user-intros.component.scss']
})
export class UserIntrosComponent implements OnInit, OnDestroy {
  public servers: Server[] = [];
  public selectedServer: Server | undefined;
  public searchText: string = '';
  public users: User[] = [];
  public cacheIntroBefore: string | undefined;
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;
  private readonly destroyed$: Subject<void> = new Subject<void>();

  public get filteredUsers() {
    let users;
    if(this.searchText.length > 0){
      const re = new RegExp(this.searchText,'i');
      users = this.users.filter(user => user.username && re.test(user.username));
    }
    else{
      users = this.users;
    }
    return users;
  }

  constructor(private readonly dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.servers.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(servers => {
      this.servers = servers;
      this.selectedServer = this.servers.find(()=> true);
      if(this.selectedServer) {
        this.fetchUserData();
      }
    });
  }

  public updateIntro(userId: string, serverId: string, soundId: string | undefined) {
    this.dataService.updateIntro(soundId, serverId, userId);
  }

  public fetchUserData() {
    if(this.selectedServer) {
      this.dataService.getUserData(this.selectedServer.id).subscribe(users => {
        this.users = users;
      });
    }
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
