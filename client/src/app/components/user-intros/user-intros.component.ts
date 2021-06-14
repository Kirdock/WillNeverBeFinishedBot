import { Component, OnInit } from '@angular/core';
import { Server } from 'src/app/models/Server';
import { Sounds } from 'src/app/models/Sounds';
import { User } from 'src/app/models/User';
import { UserServerInformation } from 'src/app/models/UserServerInformation';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-user-intros',
  templateUrl: './user-intros.component.html',
  styleUrls: ['./user-intros.component.scss']
})
export class UserIntrosComponent implements OnInit {
  public servers: UserServerInformation[] = [];
  public selectedServer: Server | undefined;
  public searchText: string = '';
  public users: User[] = [];
  public cacheIntroBefore: string | undefined;
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;

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

  ngOnInit(): void {
  }

  public updateIntro(userId: string, intro: string | undefined) {
    this.dataService.updateIntro(userId, intro);
  }

  public fetchUserData() {
    if(this.selectedServer) {
      this.dataService.loadUserData(this.selectedServer.id);
    }
  }

}
