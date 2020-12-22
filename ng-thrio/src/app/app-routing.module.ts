import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { MainMenuComponent } from './main-menu/main-menu.component';

const routes: Routes = [
  { path: '', component: MainMenuComponent },
  { path: 'play/:roomCode', component: GameComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
