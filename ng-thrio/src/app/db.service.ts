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

  sendChat(roomCode: string, playerIdx: number, msg: string): void {
    msg = msg?.slice(0, 50)?.trim();
    if (msg?.length) this.rtdb.list('rooms/' + roomCode + '/chat/').push({ msg, playerIdx });
  }

  public getChat(roomCode: string): Observable<any> {
    return this.rtdb.list('rooms/' + roomCode + '/chat',  ref => ref.limitToLast(10)).valueChanges();
  }

  public getUser(uid: string): Observable<User> {
    return this.rtdb.object('users/' + uid).valueChanges();
  }
}
