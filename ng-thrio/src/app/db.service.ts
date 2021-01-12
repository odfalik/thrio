import { User } from '../../../Interfaces';
import { AngularFireDatabase } from '@angular/fire/database';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  constructor(
    public rtdb: AngularFireDatabase
  ) {}

  public getRoom(roomCode: string): Observable<any> {
    return this.rtdb.object('rooms/' + roomCode + '/public').valueChanges();
  }

  public getUser(uid: string): Observable<User> {
    return this.rtdb.object('users/' + uid).valueChanges();
  }
}
