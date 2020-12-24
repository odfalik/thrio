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
  public room: any;
  public room$ = new Subject<any>();
  private _room: Subscription;

  rendererCanvas: ElementRef<HTMLCanvasElement>;
  canMove = true;

  constructor(
    private router: Router,
    private fns: FunctionsService,
    private dbs: DbService,
  ) {

  }

  tryJoinRoom(roomCode: string): void {
    // const tokens: { roomCode: string, token: string }[] = JSON.parse(localStorage.getItem('tokens')) || [];
    // const token = tokens.find(t => t.roomCode === roomCode);

    this.fns.joinRoom$({ roomCode: roomCode.toUpperCase(), name: this.name }).subscribe(joinData => {
      if (joinData?.error) {
        this.leaveRoom();
        return;
      }

      console.log('joinData', joinData);
      // if (joinData.token) {
      //   if (tokens.length > 10) tokens.shift();
      //   tokens.push({ roomCode, token: joinData.token })
      //   localStorage.setItem('tokens', JSON.stringify(tokens));
      // }

      this._room = this.dbs.getRoom(roomCode).subscribe(room => {
        if (!room) setTimeout(() => this.leaveRoom(), 3000);  // room doesn't exist
        // else if (!this.room) this.loadRoom();

        this.room = room;
        this.room.waiting = new Array(3 - this.room.players?.length);
        this.room$.next(this.room);
      });
    });
  }

  leaveRoom(): void {
    this.router.navigate(['/']);
  }

  makeMove(pos: { x: number, z: number }): void {
    if (!this.canMove) return;
    setTimeout(() => {
      this.canMove = true;
    }, 1000);
    this.canMove = false;

    this.fns.makeMove$({
      roomCode: this.room.roomCode,
      ...pos,
      player: this.name
    }).subscribe(res => {
      if (res?.error) console.error(res);
    });
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }

}
