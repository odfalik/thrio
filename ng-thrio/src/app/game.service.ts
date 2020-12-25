import { Room } from '../../../interfaces';
import { DbService } from './db.service';
import { FunctionsService } from './functions.service';
import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {

  public name = localStorage.getItem('name') || 'guest';
  public room: Room;
  public room$ = new Subject<Room>();
  private _room: Subscription;

  rendererCanvas: ElementRef<HTMLCanvasElement>;
  canMove = true;
  playerIdx: number;

  constructor(
    private router: Router,
    private fns: FunctionsService,
    private dbs: DbService,
  ) {

  }

  tryJoinRoom(roomCode: string): void {

    this.fns.joinRoom$({ roomCode: roomCode.toUpperCase(), name: this.name }).subscribe(joinData => {
      if (joinData === undefined) {
        this.leaveRoom();
        return;
      }

      this.playerIdx = joinData;

      console.log('joinData', joinData);

      this._room = this.dbs.getRoom(roomCode).subscribe(room => {
        if (!room) setTimeout(() => this.leaveRoom(), 2000);  // room doesn't exist

        this.room = room;
        this.room.waiting = new Array(3 - this.room.players?.length);
        this.room$.next(this.room);

        console.log('room', this.room);
      });
    });
  }

  leaveRoom(): void {
    this.router.navigate(['/']);
  }

  makeMove(pos: { x: number, z: number }): void {
    if (!this.canMove || this.room?.nextPlayer !== this.playerIdx) return;
    setTimeout(() => {
      this.canMove = true;
    }, 1000);
    this.canMove = false;

    this.fns.makeMove$({
      roomCode: this.room.roomCode,
      ...pos,
      player: this.name,
      playerIdx: this.playerIdx,
    }).subscribe(res => {
      if (res?.error) console.error(res);
    });
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }

}
