import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { environment as env } from 'src/environments/environment';
import { RoomConfig } from '../../../Interfaces';

@Injectable({
  providedIn: 'root',
})
export class FunctionsService {

  api = env.appengine + '/api/';

  getRooms$(params: any): Observable<any> {
    return this.http.get(this.api + 'get-rooms');
  }

  joinRoom$: (params?: { roomCode: string }) => Observable<{roomCode: string, playerIdx: number}> = this.fns.httpsCallable('joinRoom');

  newRoom$: (params: RoomConfig) => Observable<any> = this.fns.httpsCallable('newRoom');

  resetRoom$: (params: { roomCode: string }) => Observable<void> = this.fns.httpsCallable('resetRoom');

  makeMove$ = this.fns.httpsCallable('makeMove');

  saveToken$: (params: {
    token: string | boolean,
  }) => Observable<void> = this.fns.httpsCallable('saveToken');

  constructor(private fns: AngularFireFunctions, private http: HttpClient) {}
}
