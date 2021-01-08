import { User } from '../../../Interfaces';
import { AngularFireDatabase } from '@angular/fire/database';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  constructor(public rtdb: AngularFireDatabase) {}

  public getRoom(roomCode: string): Observable<any> {
    return this.rtdb.object('rooms/' + roomCode + '/public').valueChanges();
    // return this.rtdb
    //   .list('rooms', (ref) => ref.orderByChild('roomCode').equalTo(roomCode))
    //   .valueChanges()
    //   .pipe(map((rooms: any[]) => (rooms?.length ? rooms[0] : null)));
  }

  public getUser(uid: string): Observable<User> {
    return this.rtdb.object('users/' + uid).valueChanges();
  }

  public getOpenRooms(): Observable<any> {
    throw new Error("Not implemented");
  }
}
