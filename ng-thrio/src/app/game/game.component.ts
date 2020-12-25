import { GameService } from './../game.service';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as THREE from 'three';
import { EngineService } from '../engine.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  @ViewChild('rendererCanvas', {static: true})
  public rendererCanvas: ElementRef<HTMLCanvasElement>;
  private _params: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    public gs: GameService,
    public engineService: EngineService
  ) {

    this._params = this.activatedRoute.params.subscribe((params) => {
      const roomCode = params.roomCode;

      if (roomCode) {
        this.gs.tryJoinRoom(roomCode);
      } else {
        setTimeout(() => this.gs.leaveRoom(), 3000); // no room code
      }
    });
  }

  ngOnInit(): void {
    this.engineService.createScene(this.rendererCanvas);
    this.engineService.animate();
  }

  ngOnDestroy(): void {
    if (this._params) this._params.unsubscribe();
  }

}
