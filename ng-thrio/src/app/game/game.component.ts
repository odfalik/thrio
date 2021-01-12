import { fadeAnim } from './../animations';
import { RoomService } from '../room.service';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as THREE from 'three';
import { EngineService } from '../engine.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  animations: [fadeAnim],
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;
  private _params: Subscription;
  canShare: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    public rs: RoomService,
    public authService: AuthService,
    public engineService: EngineService
  ) {
    this._params = this.activatedRoute.params.subscribe((params) => {
      const roomCode = params.roomCode;

      if (roomCode) {
        this.rs.tryJoinRoom(roomCode);
      } else {
        setTimeout(() => this.rs.leaveRoom(), 3000); // no room code
      }
    });
    this.canShare = !!navigator.share;
  }

  ngOnInit(): void {
    this.engineService.createScene(this.rendererCanvas);
    this.engineService.animate();
  }

  shareRoom(): void {
    navigator.share({
      url: `https://thrio.app/play/${this.rs.room.roomCode}`,
      title: 'Play Thrio with me!',
      text: 'You\'ve been invited to a Thrio game',
    });
  }

  ngOnDestroy(): void {
    if (this._params) this._params.unsubscribe();
  }
}
