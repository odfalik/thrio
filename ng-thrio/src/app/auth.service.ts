import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: any;

  constructor(
    public auth: AngularFireAuth,
  ) {
    this.auth.setPersistence('local').then(() => {
      this.auth.signInAnonymously();
    });

    this.auth.user.subscribe(u => {
      this.user = u;
      console.log('user', u);

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
