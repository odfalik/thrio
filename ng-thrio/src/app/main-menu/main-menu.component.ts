import { slideAnim, slideVAnim } from './../animations';
import { FunctionsService } from './../functions.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoomConfig, RoomPublic } from '../../../../Interfaces';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  animations: [slideAnim, slideVAnim],
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
  rooms: RoomPublic[];
  gettingRooms = false;
  canGetRooms = true;

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

  getRooms(): void {
    if (!this.canGetRooms) return;
    this.gettingRooms = true;
    this.canGetRooms = false;
    setTimeout(() => {
      this.canGetRooms = true;
    }, 25000);

    this.fns.getRooms$({}).subscribe(
      (rooms: RoomPublic[]) => {
        console.log('getRooms:', rooms);
        this.rooms = rooms;
        this.gettingRooms = false;
      },
      (err) => {
        this.rooms = [];
        this.gettingRooms = false;
      }
    );
  }

  joinPublic(): void {
    this.searching = true;
    this.fns.joinRoom$().subscribe(
      res => {
        this.joinRoom(res.roomCode);
      },
      err => {
        console.error('joinPublic err', err);
      }
    );
  }
}
