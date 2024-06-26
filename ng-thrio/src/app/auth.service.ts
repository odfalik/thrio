import { DbService } from './db.service';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { first } from 'rxjs/operators';
import { User } from '../../../Interfaces';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { FunctionsService } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user: any;
  private _dbUser: any;
  dbUser: User;
  pushRequest: boolean;
  isNewUser = false;
  tmpName = '';

  prefs: User['prefs'] = {
    graphics: 1,
    doubleTap: false,
  };

  constructor(
    public auth: AngularFireAuth,
    private dbService: DbService,
    private afMessaging: AngularFireMessaging,
    private fns: FunctionsService
  ) {
    this.auth.setPersistence('local').then(() => {
      this.auth.signInAnonymously().then((cred) => {
        if (cred.additionalUserInfo.isNewUser) this.isNewUser = true;
      });
    });

    this.auth.user.subscribe((u) => {
      this.user = u;
      console.log('user', u);

      if (this._dbUser) this._dbUser.unsubscribe();
      if (this.user) {
        if (!this.user.displayName) this.changeName();

        this._dbUser = this.dbService
          .getUser(this.user.uid)
          .subscribe((dbUser: User) => {
            this.dbUser = dbUser;
            if (dbUser?.prefs) this.prefs = dbUser.prefs;
          });

        this.tmpName = this.user.displayName;
      }
    });
  }

  changeName(displayName?: string): void {
    displayName = displayName?.toUpperCase().slice(0, 15).trim();
    if (!displayName) displayName = 'Guest' + Math.floor(Math.random() * Math.floor(10000));
    else if (displayName === 'SIGNOUT') {
      this.signOut();
      return;
    }
    this.user.updateProfile({ displayName });
  }

  setPrefs(prefs: User['prefs']): Promise<void> {
    this.prefs = { ...this.prefs, ...prefs };
    return this.dbService.rtdb.object('users/' + this.user.uid + '/prefs').set(this.prefs);
  }

  signOut(): Promise<void> {
    return this.auth.signOut();
  }
}
