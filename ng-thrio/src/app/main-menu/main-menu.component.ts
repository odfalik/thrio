import { FunctionsService } from './../functions.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoomConfig } from '../../../../Interfaces';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: '0' }),
        animate('300ms ease-in', style({ opacity: '1' })),
      ]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: '0' }))]),
    ]),
  ],
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
      .newRoom$({ name: this.name, config: this.config })
      .subscribe((roomCode: string) => {
        this.joinRoom(roomCode);
      });
  }

  joinPublic(): void {
    this.searching = true;
    setTimeout(() => {
      this.searching = false;
    }, 5000);
  }
}
