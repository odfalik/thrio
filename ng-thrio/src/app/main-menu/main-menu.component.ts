import { FunctionsService } from './../functions.service';
import { DbService } from './../db.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  roomCode = '';
  name = localStorage.getItem('name') || '';

  // @ViewChild('canvas', { static: true })
  // canvas: ElementRef<HTMLCanvasElement>;
  // ctx: CanvasRenderingContext2D;

  constructor(
    private dbs: DbService,
    private fns: FunctionsService,
    private router: Router,
  ) {

  }

  ngOnInit(): void {
    // this.ctx = this.canvas.nativeElement.getContext('2d');
    // this.initCanvas();
  }

  // initCanvas(): void {
  //   this.ctx.strokeStyle = '#fff';
  //   document.body.addEventListener('mousemove', this.animateCursor.bind(this), false);
  //   document.body.addEventListener('deviceorientation', this.animateGyro.bind(this), true);
  //   this.animate(); // temp
  // }

  joinRoom(roomCode: string = this.roomCode): void {
    localStorage.setItem('name', this.name);
    this.router.navigate(['/play', roomCode]);
  }

  newRoom(): void {
    this.fns.newRoom$({}).subscribe((roomCode: string) => {
      this.joinRoom(roomCode);
    });
  }

  // animateCursor($e) {
  //   this.animate($e.pageX - document.body.clientWidth/2, $e.pageY - document.body.clientHeight/2);
  // }
  // animateGyro($e) {
  //   this.e = $e;
  //   console.log($e);
  // }
  // animate(xOffset = 1, yOffset = 1): void {
  //   // console.log(xOffset, yOffset);
  //   this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  //   for (let i = 1; i < 5; i++) {
  //     this.ctx.beginPath();
  //     this.ctx.arc(150 + xOffset/(10*i), 150 + yOffset/(10*i), 50 + 15*i, 0, 2 * Math.PI);
  //     this.ctx.stroke();
  //   }
  // }
}
