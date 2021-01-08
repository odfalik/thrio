import { DbService } from './db.service';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { first } from 'rxjs/operators';
import { User } from '../../../Interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: any;
  private _dbUser: any;
  dbUser: User;

  constructor(
    public auth: AngularFireAuth,
    private dbService: DbService,
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

  signOut(): Promise<void> {
    return this.auth.signOut();
  }
}
