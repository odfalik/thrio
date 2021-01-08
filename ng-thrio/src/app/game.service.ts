import { RoomPublic } from './../../../Interfaces';
import { DbService } from './db.service';
import { FunctionsService } from './functions.service';
import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { catchError, filter, first } from 'rxjs/operators';
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
  playerIdx: number;
  spectating: boolean;
  pushRequest: boolean;

  constructor(
    private router: Router,
    private fns: FunctionsService,
    private dbs: DbService,
    private authService: AuthService,
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
          (joinData: number) => {
            if (joinData === undefined) {
              this.leaveRoom();
            } else {
              this.playerIdx = joinData;
              console.log('joinData', joinData);
              this.subToRoom(roomCode);
            }
          },
          (err) => {
            this.subToRoom(roomCode, true);
          }
        );
      });
  }

  subToRoom(roomCode: string, spectating = false): void {
    if (this._room) this._room.unsubscribe();
    this._room = this.dbs.getRoom(roomCode).subscribe((room) => {
      if (!room) setTimeout(() => this.leaveRoom(), 2000); // room doesn't exist

      this.spectating = spectating;
      this.room = room;
      this.room.waiting = new Array(3 - this.room.players?.length);
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
    if (
      !this.canMove ||
      this.room?.nextPlayerIdx !== this.playerIdx ||
      this.spectating
    )
      return;
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

  requestPermission(): void {
    if (!this.authService.dbUser?.token) {
      this.afMessaging.requestToken.subscribe(
        (token) => {
          this.fns.saveToken$({ token }).subscribe(() => {
            this.pushRequest = false;
          });
        },
        (error) => {
          this.pushRequest = false;
        }
      );
    }
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }
}
