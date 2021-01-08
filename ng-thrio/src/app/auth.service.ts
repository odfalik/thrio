import { DbService } from './db.service';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { first } from 'rxjs/operators';
import { User } from '../../../Interfaces';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { FunctionsService } from './functions.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: any;
  private _dbUser: any;
  dbUser: User;
  pushRequest: boolean;

  constructor(
    public auth: AngularFireAuth,
    private dbService: DbService,
    private afMessaging: AngularFireMessaging,
    private fns: FunctionsService,
  ) {
    this.auth.setPersistence('local').then(() => {
      this.auth.signInAnonymously();
    });

    this.auth.user.subscribe(u => {
      this.user = u;
      // console.log('user', u);

      if (this._dbUser) this._dbUser.unsubscribe();
      this._dbUser = this.dbService.getUser(u.uid).subscribe((dbUser: User) => {
        this.dbUser = dbUser;
      });

      if (u && !u.displayName) this.changeName('Guest' + Math.floor(Math.random() * Math.floor(10000)));
    });
  }

  changeName(displayName: string): void {
    this.user.updateProfile({ displayName });
  }

  requestPermission(): void {
    if (!this.dbUser?.token) {
      this.afMessaging.requestToken.subscribe(
        (token) => {
          this.fns.saveToken$({ token }).subscribe(() => {
            this.pushRequest = false;
          });
        },
        (error) => {
          this.fns.saveToken$({ token: false }).subscribe(() => {
            this.pushRequest = false;
          });
        }
      );
    }
  }

  signOut(): Promise<void> {
    return this.auth.signOut();
  }
}
