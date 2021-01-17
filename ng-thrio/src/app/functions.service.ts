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

  getRooms$(): Observable<any> {
    return this.http.get(this.api + `rooms`);
  }

  newRoom$(params: RoomConfig) {
    return this.http.post<{ roomCode: string }>(this.api + `rooms`, params);
  }

  joinRoom$(roomCode: string): Observable<any> {
    return this.http.get(this.api + `rooms/${roomCode}/join`);
  }

  resetRoom$(roomCode: string): Observable<any> {
    return this.http.get(this.api + `rooms/${roomCode}/reset`);
  }

  makeMove$(roomCode: string, x: number, z: number): Observable<any> {
    return this.http.post(this.api + `rooms/${roomCode}/move`, { x, z });
  }

  constructor(private http: HttpClient) {}
}
