import { RoomPublic } from './../../../Interfaces';
import { DbService } from './db.service';
import { FunctionsService } from './functions.service';
import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { filter, first } from 'rxjs/operators';
import { AngularFireMessaging } from '@angular/fire/messaging';

@Injectable({
  providedIn: 'root',
})
export class GameService implements OnDestroy {
  public room: RoomPublic;
  public room$ = new Subject<RoomPublic>();
  private _room: Subscription;

  rendererCanvas: ElementRef<HTMLCanvasElement>;
  canMove = true;
  public playerIdx: number;
  pushRequest = false;
  isNextPlayer = false;
  waiting: any[];

  constructor(
    private router: Router,
    private fns: FunctionsService,
    private dbs: DbService,
    public auth: AngularFireAuth,
    private afMessaging: AngularFireMessaging
  ) {}

  tryJoinRoom(roomCode: string): void {
    this.auth.user
      .pipe(
        filter((u) => !!u.displayName),
        first()
      )
      .subscribe((u) => {
        this.fns.joinRoom$({ roomCode: roomCode.toUpperCase() }).subscribe(
          (joinData) => {
            if (joinData === undefined) {
              this.leaveRoom();
            } else {
              roomCode = joinData.roomCode;
              this.playerIdx = joinData.playerIdx;
              console.log();
              console.log('joinData (my playerIdx)', this.playerIdx);
              this.subToRoom(roomCode);
            }
          },
          (err) => {
            console.error('joinRoom:', err);
            this.leaveRoom();
          }
        );
      });
  }

  subToRoom(roomCode: string): void {
    if (this._room) this._room.unsubscribe();
    this._room = this.dbs.getRoom(roomCode).subscribe((room: RoomPublic) => {
      console.log('subToRoom', room);


      if (!room) return setTimeout(() => this.leaveRoom(), 2000); // room doesn't exist

      this.isNextPlayer = room?.nextPlayerIdx === this.playerIdx;
      this.room = room;
      if (this.room?.status === 'waiting' && this.room?.players)
        this.waiting = new Array(3 - this.room.players.length);
      this.room$.next(this.room);

      console.log('room', this.room);
    });
  }

  leaveRoom(): void {
    delete this.room;
    this.ngOnDestroy();
    this.router.navigate(['/']);
  }

  makeMove(pos: { x: number; z: number }): void {
    if (!this.canMove || !this.isNextPlayer) return;
    setTimeout(() => {
      this.canMove = true;
    }, 1000);
    this.canMove = false;

    this.fns
      .makeMove$({
        roomCode: this.room.roomCode,
        ...pos,
        playerIdx: this.playerIdx,
      })
      .subscribe(async (res) => {
        const token = await this.afMessaging.getToken.pipe(first()).toPromise();
        if (!token) this.pushRequest = true;
      });
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }
}
