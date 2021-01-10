import { slideAnim } from './../animations';
import { FunctionsService } from './../functions.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoomConfig } from '../../../../Interfaces';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  animations: [slideAnim],
})
export class MainMenuComponent implements OnInit {
  roomCode = '';
  name = '';
  searching: boolean;
  config: RoomConfig = {
    public: true,
    dimensions: 3,
    players: 3,
    timer: '',
  };
  mode = 'menu';

  constructor(
    public authService: AuthService,
    private fns: FunctionsService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  joinRoom(roomCode: string = this.roomCode): void {
    roomCode = roomCode.toUpperCase();
    this.router.navigate(['/play', roomCode]);
  }

  newRoom(): void {
    this.fns
      .newRoom$(this.config)
      .subscribe((roomCode: string) => {
        this.joinRoom(roomCode);
      });
  }

  joinPublic(): void {
    this.searching = true;
    this.fns.joinRoom$().subscribe(
      res => {
        this.joinRoom(res.roomCode)
      },
      err => {
        console.error('joinPublic err', err)
      }
    )
  }
}
