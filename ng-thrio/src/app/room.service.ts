import { RoomPublic } from '../../../Interfaces';
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
export class RoomService implements OnDestroy {
  public room: RoomPublic;
  public room$ = new Subject<RoomPublic>();
  private _room: Subscription;

  rendererCanvas: ElementRef<HTMLCanvasElement>;
  canMove = true;
  public playerIdx: number;
  pushRequest = false;
  isNextPlayer = false;
  waiting: any[];
  public chat: string[];
  private _chat: Subscription;

  constructor(
    private router: Router,
    public fns: FunctionsService,
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

      if (!room) this.leaveRoom(); // room doesn't exist

      this.isNextPlayer = room?.nextPlayerIdx === this.playerIdx;
      this.room = room;

      this.room$.next(this.room);

      if (this.room?.status === 'waiting' && this.room?.players)
        this.waiting = new Array(3 - this.room.players.length);

      console.log('room', this.room);
    });

    // if (this._chat) this._chat.unsubscribe();
    // this._chat = this.dbs.getChat(roomCode).subscribe((chat: string[]) => {
    //   this.chat = chat;
    // });
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

  resetRoom(): void {
    this.fns.resetRoom$({ roomCode: this.room?.roomCode }).subscribe(res => {
      console.log('reset res', res);
    });
  }

  sendChat(): void {

  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }
}
