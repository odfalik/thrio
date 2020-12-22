import { FunctionsService } from './../functions.service';
import { DbService } from './../db.service';
import { Component, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  roomCode = '';
  name = localStorage.getItem('name') || '';

  constructor(
    private dbs: DbService,
    private fns: FunctionsService,
    private router: Router
  ) {

  }

  ngOnInit(): void {

  }

  joinRoom(roomCode: string = this.roomCode): void {
    if (this.name?.length) {
      localStorage.setItem('name', this.name);
      this.router.navigate(['/play', roomCode]);
    }
  }

  newRoom(): void {
    this.fns.newRoom$({}).subscribe((roomCode: string) => {
      this.joinRoom(roomCode);
    });
  }

}
