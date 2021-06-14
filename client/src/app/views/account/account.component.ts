import { Component, OnInit } from '@angular/core';
import { Server } from 'src/app/models/Server';
import { Sounds } from 'src/app/models/Sounds';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  public servers: Server[] = [];
  public selectedServer: Server | undefined;
  public cacheIntroBefore: string | undefined;
  public soundCategories: string[] = [];
  public sounds: Sounds | undefined;
  public user: User | undefined;

  constructor() { }

  ngOnInit(): void {
  }

  public serverChanged() {

  }

  public updateIntro(reset: boolean = false) {

  }

}
