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

  newRoom$: (params: RoomConfig) => Observable<any> = this.fns.httpsCallable('newRoom');

  resetRoom$: (params: { roomCode: string }) => Observable<void> = this.fns.httpsCallable('resetRoom');

  makeMove$ = this.fns.httpsCallable('makeMove');

  constructor(private fns: AngularFireFunctions) {}
}
