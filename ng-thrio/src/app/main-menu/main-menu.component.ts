import { slideAnim, slideVAnim } from './../animations';
import { FunctionsService } from './../functions.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoomConfig, RoomPublic } from '../../../../Interfaces';
import { AngularFireAuth } from '@angular/fire/auth';

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
  creating: boolean;

  constructor(
    public authService: AuthService,
    public auth: AngularFireAuth,
    private fns: FunctionsService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  joinRoomWithTimer(): void {
    setTimeout(() => this.joinRoom(), 1000);
  }

  joinRoom(roomCode: string = this.roomCode): void {
    roomCode = roomCode.toUpperCase();
    this.router.navigate(['/play', roomCode]);
  }

  newRoom(): void {
    this.creating = true;
    this.fns
      .newRoom$(this.config)
      .subscribe((res) => {
        this.creating = false;
        this.joinRoom(res.roomCode);
      });
  }

  getRooms(): void {
    if (!this.canGetRooms) return;
    this.gettingRooms = true;
    this.canGetRooms = false;
    setTimeout(() => {
      this.canGetRooms = true;
    }, 25000);

    this.fns.getRooms$().subscribe(
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
}
