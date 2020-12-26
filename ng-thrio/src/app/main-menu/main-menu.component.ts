import { FunctionsService } from './../functions.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  roomCode = '';
  name = '';
  searching: boolean;
  showConfig: boolean;

  constructor(
    public authService: AuthService,
    private fns: FunctionsService,
    private router: Router,
  ) {

  }

  ngOnInit(): void {

  }

  joinRoom(roomCode: string = this.roomCode): void {
    roomCode = roomCode.toUpperCase();
    this.router.navigate(['/play', roomCode]);
  }

  newRoom(): void {
    this.fns.newRoom$({ name: this.name }).subscribe((roomCode: string) => {
      this.joinRoom(roomCode);
    });
  }

  joinPublic(): void {
    this.searching = true;
  }
}
