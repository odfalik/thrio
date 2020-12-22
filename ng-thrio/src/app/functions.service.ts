import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class FunctionsService {

  joinRoom$ = this.fns.httpsCallable('joinRoom');
  newRoom$ = this.fns.httpsCallable('newRoom');
  makeMove$ = this.fns.httpsCallable('makeMove');

  constructor(
    private fns: AngularFireFunctions
  ) {

  }


}
