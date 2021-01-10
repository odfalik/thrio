import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { RoomConfig } from '../../../Interfaces';

@Injectable({
  providedIn: 'root',
})
export class FunctionsService {

  getRooms$ = this.fns.httpsCallable('getRooms');

  joinRoom$: (params?: { roomCode: string }) => Observable<{roomCode: string, playerIdx: number}> = this.fns.httpsCallable('joinRoom');

  newRoom$: (data: RoomConfig) => Observable<any> = this.fns.httpsCallable('newRoom');

  makeMove$ = this.fns.httpsCallable('makeMove');

  saveToken$: (data: {
    token: string | boolean,
  }) => Observable<void> = this.fns.httpsCallable('saveToken');

  constructor(private fns: AngularFireFunctions) {}
}
