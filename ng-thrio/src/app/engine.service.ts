import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomPublic } from '../../../Interfaces';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root',
})
export class EngineService implements OnDestroy {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;

  public updateFns: (() => void)[];
  private balls: THREE.Mesh[] = [];
  private selectors = [];

  private frameId: number = null;
  private controls: any;
  private mouse = new THREE.Vector2();
  private clock = new THREE.Clock();
  private lastMove: { x: number; y: number; z: number };

  public constructor(private ngZone: NgZone, private gs: GameService) {
    this.gs.room$.subscribe((room) => {
      this.onRoom(room);
    });
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    this.canvas = canvas.nativeElement;

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true, // transparent background
      antialias: true, // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    /* Scene */
    this.scene = new THREE.Scene();

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight
    );
    this.camera.position.y = 4;
    this.camera.position.z = 10;
    this.scene.add(this.camera);

    /* Orbit controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(1.5, 1.5, 1.5);
    this.controls.autoRotateSpeed = -0.25;
    this.controls.autoRotate = true;
    this.controls.enableKeys = true;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.update();

    /* Lighting */
    let light: THREE.Light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-1, 7, 1);
    this.scene.add(light);
    light = new THREE.AmbientLight(0xffffff, 0.3);
    light.position.set(1, -3, -2);
    this.scene.add(light);
    // light = new THREE.PointLight(0xffffff, 0.8);
    // light.position.set(5, 5, 5);
    // this.scene.add(light);

    /* Grid */
    const planeMat = new THREE.MeshLambertMaterial({
      opacity: 0.05,
      transparent: true,
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const planeGeom = new THREE.PlaneGeometry(3, 3, 1, 1);
    for (let i = 0; i < 4; i++) {
      const plane = new THREE.Mesh(planeGeom, planeMat);
      this.scene.add(plane);
      plane.position.set(1.5, 1.5, i);
    }
    for (let i = 0; i < 4; i++) {
      const plane = new THREE.Mesh(planeGeom, planeMat);
      this.scene.add(plane);
      plane.position.set(i, 1.5, 1.5);
      plane.rotateY(Math.PI / 2);
    }
    const bottomPlane = new THREE.Mesh(planeGeom, planeMat);
    this.scene.add(bottomPlane);
    bottomPlane.position.set(1.5, 0, 1.5);
    bottomPlane.rotateX(Math.PI / 2);

    /* Origin dot */
    const dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    // dotGeometry.vertices.push(new THREE.Vector3(1.5, 1.5, 1.5));
    const dotMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffffff,
    });
    const dot = new THREE.Points(dotGeometry, dotMaterial);
    this.scene.add(dot);
  }

  onCanvasDown(e): void {
    this.mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }

  onCanvasUp(e): void {
    const upX = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    const upY = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    if (
      Math.abs(this.mouse.x - upX) < 25 &&
      Math.abs(this.mouse.y - upY) < 25
    ) {
      this.mouse.x = upX;
      this.mouse.y = upY;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children);
      intersects.forEach((intersect) => {
        if (intersect.object.userData.selector) {
          this.gs.makeMove({
            x: intersect.object.userData.selector.x,
            z: intersect.object.userData.selector.z,
          });
        }
      });
    }
  }

  onCanvasMove(e): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);

    if (intersects.some((i) => i.object.userData.clickable)) {
      document.getElementsByTagName('body')[0].style.cursor = 'pointer';
    } else {
      document.getElementsByTagName('body')[0].style.cursor = 'default';
    }
  }

  public animate(): void {
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      this.canvas.addEventListener(
        'mousedown',
        this.onCanvasDown.bind(this),
        false
      );
      this.canvas.addEventListener(
        'pointerdown',
        this.onCanvasDown.bind(this),
        false
      );

      this.canvas.addEventListener(
        'mouseup',
        this.onCanvasUp.bind(this),
        false
      );
      this.canvas.addEventListener(
        'pointerup',
        this.onCanvasUp.bind(this),
        false
      );

      this.canvas.addEventListener(
        'mousemove',
        this.onCanvasMove.bind(this),
        false
      );

      window.addEventListener(
        'resize',
        (() => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }).bind(this)
      );
    });
  }

  public render(deltaTime?: number): void {
    this.frameId = requestAnimationFrame((d) => {
      this.render(this.clock.getDelta());
    });

    this.controls.update();

    if (deltaTime) {
      let i = this.balls.length;
      while (i--) {
        const ball = this.balls[i];

        if (ball.userData.dropIn || ball.userData.dropOut) {
          ball.position.setY(ball.position.y - 15 * deltaTime);

          if (ball.position.y < ball.userData.y + 0.5) {
            // Reached end of its fall

            if (ball.userData.dropIn) {
              ball.position.set(
                ball.userData.x + 0.5,
                ball.userData.y + 0.5,
                ball.userData.z + 0.5
              );
              ball.userData = {
                x: ball.userData.x,
                y: ball.userData.y,
                z: ball.userData.z,
              };
            } else if (ball.userData.dropOut) {
              this.scene.remove(ball);
              this.balls.splice(i, 1);
            }
          }
        }
      }
    }

    // if (this.updateFns?.length) {
    //   this.updateFns.forEach((fn) => fn());
    // }

    this.renderer.render(this.scene, this.camera);
  }

  public onRoom(room: RoomPublic): void {
    const reset = room.lastMove === 'reset';

    /* Balls */
    this.balls.forEach((ball) => {
      this.scene.remove(ball);
    });
    this.balls = [];
    const ballGeom = new THREE.SphereGeometry(0.5, 16, 16);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const val = room.grid[x][y][z];
          if (val !== -1) {
            let color;
            if (val === 0) color = 0x2ec4b6;
            else if (val === 1) color = 0xe71d36;
            else if (val === 2) color = 0xff9f1c;

            const material = new THREE.MeshPhongMaterial({
              color,
              shininess: 50,
            });

            const sphere = new THREE.Mesh(ballGeom, material);
            this.scene.add(sphere);
            sphere.userData = reset
              ? { x: x - 10, y: y - 10, z: z - 10 }
              : { x, y, z };
            sphere.position.set(x + 0.5, y + 0.5, z + 0.5);
            sphere.rotation.set(
              Math.random() * 365,
              Math.random() * 365,
              Math.random() * 365
            );
            this.balls.push(sphere);

            if (reset) {
              sphere.userData.dropOut = true;
            } else if (
              x === room.lastMove?.x &&
              y === room.lastMove?.y &&
              z === room.lastMove?.z &&
              (x !== this.lastMove?.x ||
                y !== this.lastMove?.y ||
                z !== this.lastMove?.z)
            ) {
              sphere.position.setY(y + 10);
              sphere.userData.dropIn = true;
              this.lastMove = { x, y, z };
            }
          }
        }
      }
    }

    /* Top selectors */
    this.selectors.forEach((sel) => {
      this.scene.remove(sel);
    });
    this.selectors = [];
    if (this.gs.isNextPlayer) {
      const selectorMat = new THREE.MeshBasicMaterial({
        opacity: 0.4,
        transparent: true,
        color: 0xffffff,
      });
      const selectorGeom = new THREE.ConeGeometry(0.3, 0.3, 4, 1);
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          if (room.grid[x][2][z] === -1) {
            const selector = new THREE.Mesh(selectorGeom, selectorMat);
            this.scene.add(selector);
            selector.position.set(x + 0.5, 3.3, z + 0.5);
            selector.rotateX(-Math.PI);
            selector.userData = {
              selector: { x, z },
              clickable: true,
            };
            this.selectors.push(selector);
          }
        }
      }
    }
  }
}
