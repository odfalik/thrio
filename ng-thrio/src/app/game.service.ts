import { Room, RoomPublic } from './../../../Interfaces';
import { DbService } from './db.service';
import { FunctionsService } from './functions.service';
import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { filter, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {

  public room: RoomPublic;
  public room$ = new Subject<RoomPublic>();
  private _room: Subscription;

  rendererCanvas: ElementRef<HTMLCanvasElement>;
  canMove = true;
  playerIdx: number;

  constructor(
    private router: Router,
    private fns: FunctionsService,
    private dbs: DbService,
    private authService: AuthService,
    public auth: AngularFireAuth,
  ) {

  }

  tryJoinRoom(roomCode: string): void {

    this.auth.user.pipe(filter(u => !!u.displayName), first()).subscribe(u => {

      this.fns.joinRoom$({ roomCode: roomCode.toUpperCase() }).subscribe((joinData: number) => {
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
    })

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
      playerIdx: this.playerIdx,
    }).subscribe(res => {
      if (res?.error) console.error(res);
    });
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }

}
