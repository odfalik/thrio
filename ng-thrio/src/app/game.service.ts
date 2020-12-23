import { DbService } from './db.service';
import { FunctionsService } from './functions.service';
import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {

  public name = localStorage.getItem('name') || 'goober';
  public room: any;
  public room$ = new Subject<any>();
  private _room: Subscription;

  rendererCanvas: ElementRef<HTMLCanvasElement>;

  constructor(
    private router: Router,
    private fns: FunctionsService,
    private dbs: DbService,
  ) {

  }

  tryJoinRoom(roomCode: string): void {
    this.fns.joinRoom$({ roomCode: roomCode.toUpperCase(), name: this.name }).subscribe(joinData => {
      console.log('joinData', joinData);
      if (joinData?.error) setTimeout(() => this.leaveRoom(), 3000); // room is full

      this._room = this.dbs.getRoom(roomCode).subscribe(room => {
        if (!room) setTimeout(() => this.leaveRoom(), 3000);  // room doesn't exist
        // else if (!this.room) this.loadRoom();

        this.room = room;
        this.room$.next(this.room);
      });
    });
  }

  leaveRoom(): void {
    this.router.navigate(['/']);
  }

  makeMove(pos: { x: number, z: number }): void {
    this.fns.makeMove$({
      roomCode: this.room.roomCode,
      ...pos,
      player: this.name
    }).subscribe(res => {
      if (res.error) console.error(res);
    });
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }

}
