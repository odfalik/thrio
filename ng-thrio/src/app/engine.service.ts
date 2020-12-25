import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
  balls = [];

  private frameId: number = null;
  controls: any;
  interaction: any;
  mouse = new THREE.Vector2();

  public constructor(
    private ngZone: NgZone,
    private gs: GameService
  ) {
    this.gs.room$.subscribe(room => {
      this.updateGrid(room.grid);
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
    let light: THREE.Light = new THREE.DirectionalLight(0xffffff, .8);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
    light = new THREE.AmbientLight(0xffffff, .3);
    light.position.set(-1, -1, -2);
    this.scene.add(light);

    /* Grid */
    const planeMat = new THREE.MeshLambertMaterial({
      opacity: 0.05,
      transparent: true,
      color: 0xFFFFFF,
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
    const plane = new THREE.Mesh(planeGeom, planeMat);
    this.scene.add(plane);
    plane.position.set(1.5, 0, 1.5);
    plane.rotateX(Math.PI / 2);

    /* Top squares */
    const squareMat = new THREE.MeshBasicMaterial({
      opacity: 0.4,
      transparent: true,
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
    });
    const squareGeom = new THREE.PlaneGeometry(0.5, 0.5, 1, 1);
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 3; z++) {
        const square = new THREE.Mesh(squareGeom, squareMat);
        this.scene.add(square);
        square.position.set(x + .5, 3, z + .5);
        square.rotateX(-Math.PI / 2);
        square.userData = {
          square: { x, z },
          clickable: true
        };
      }
    }

    /* Origin dot */
    // const dotGeometry = new THREE.Geometry();
    // dotGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    // dotGeometry.vertices.push(new THREE.Vector3(1.5, 1.5, 1.5));
    // const dotMaterial = new THREE.PointsMaterial({ size: .05, color: 0xffffff });
    // const dot = new THREE.Points(dotGeometry, dotMaterial);
    // this.scene.add(dot);
  }

  onCanvasDown(e): void {
    this.mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = - (e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }

  onCanvasUp(e): void {
    const upX = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    const upY = - (e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    if (this.mouse.x === upX && this.mouse.y === upY) {
      this.mouse.x = upX;
      this.mouse.y = upY;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children);
      intersects.forEach(intersect => {
        if (intersect.object.userData.square) {
          this.gs.makeMove({x: intersect.object.userData.square.x, z: intersect.object.userData.square.z});
        }
      });
    }
  }

  onCanvasMove(e): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);

    if (intersects.some(i => i.object.userData.clickable)) {
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

      this.canvas.addEventListener('mousedown', this.onCanvasDown.bind(this), false);
      this.canvas.addEventListener('pointerdown', this.onCanvasDown.bind(this), false );
      this.canvas.addEventListener('mousedown', this.onCanvasUp.bind(this), false);
      this.canvas.addEventListener('pointerup', this.onCanvasUp.bind(this), false );
      this.canvas.addEventListener('mousemove', this.onCanvasMove.bind(this), false);

      window.addEventListener('resize', (() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }).bind(this));
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    this.controls.update();
    // if (this.updateFns?.length) {
    //   this.updateFns.forEach((fn) => fn());
    // }

    this.renderer.render(this.scene, this.camera);
  }

  public updateGrid(grid: number[][][]): void {
    console.log('updateGrid', grid);

    this.balls.forEach(ball => {
      this.scene.remove(ball);
    });
    this.balls = [];

    const geometry = new THREE.SphereGeometry(.5, 14, 14);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const val = grid[x][y][z];
          if (val !== -1) {
            let color;
            if (val === 0) color = 0x2EC4B6;
            else if (val === 1) color = 0xE71D36;
            else if (val === 2) color = 0xFF9F1C;

            const material = new THREE.MeshPhongMaterial({ color });

            const sphere = new THREE.Mesh(geometry, material);
            this.scene.add(sphere);
            sphere.position.set(x + .5, y + .5, z + .5);
            this.balls.push(sphere);
          }
        }
      }
    }

  }
}
