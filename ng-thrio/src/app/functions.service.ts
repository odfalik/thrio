import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { RoomConfig } from '../../../Interfaces';

@Injectable({
  providedIn: 'root',
})
export class FunctionsService {
  joinRoom$ = this.fns.httpsCallable('joinRoom');
  newRoom$: (data: {
    name: string;
    config: RoomConfig;
  }) => Observable<any> = this.fns.httpsCallable('newRoom');
  makeMove$ = this.fns.httpsCallable('makeMove');

  constructor(private fns: AngularFireFunctions) {}
}
