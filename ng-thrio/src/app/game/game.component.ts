import { FunctionsService } from './../functions.service';
import { DbService } from './../db.service';
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

  public roomCode: string;
  public room: any;
  private _room: Subscription;
  public name = localStorage.getItem('name') || 'goober';

  public move = {
    x: 0,
    z: 0,
  };

  constructor(
    private engineService: EngineService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dbs: DbService,
    private fns: FunctionsService
  ) {

  }

  ngOnInit(): void {
    this.roomCode = this.activatedRoute.snapshot.params.roomCode;

    if (this.roomCode) {
      this.fns.joinRoom$({ roomCode: this.roomCode.toUpperCase(), name: this.name }).subscribe(joinData => {
        console.log('joinData', joinData)
        if (joinData?.error) setTimeout(() => this.leaveRoom(), 3000); // room is full

        this.dbs.getRoom(this.roomCode).subscribe(room => {
          if (!room) setTimeout(() => this.leaveRoom(), 3000);  // room doesn't exist
          else if (!this.room) this.loadRoom();

          this.room = room;
          console.log('room', this.room);

          this.engineService.updateGrid(room.grid);
        });
      });

    } else {
      setTimeout(() => this.leaveRoom(), 3000); // no room code
    }
  }

  makeMove(pos: { x: number, z: number }): void {
    this.fns.makeMove$({
      roomCode: this.roomCode,
      ...pos,
      player: this.name
    }).subscribe(res => {
      if (res.error) console.error(res);
    });
  }

  loadRoom(): void {
    this.engineService.createScene(this.rendererCanvas);
    this.engineService.animate();
  }

  leaveRoom(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this._room) this._room.unsubscribe();
  }

}
