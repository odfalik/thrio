import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'src/environments/environment';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { AppRoutingModule } from './app-routing.module';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SwitchComponent } from './switch/switch.component';
import { TimeAgoPipe } from './time-ago.pipe';
import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/functions';
import { USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/database';



@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    MainMenuComponent,
    SwitchComponent,
    TimeAgoPipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig, 'thrio'),
    AngularFireFunctionsModule,
    AngularFireMessagingModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    { provide: USE_FUNCTIONS_EMULATOR, useValue: environment.useEmulators ? ['localhost', 5001] : undefined },
    { provide: USE_DATABASE_EMULATOR, useValue: environment.useEmulators ? ['localhost', 9000] : undefined },

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
