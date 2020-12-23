import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Injectable({
  providedIn: 'root',
})
export class EngineService implements OnDestroy {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public light: THREE.DirectionalLight;

  public updateFns: (() => void)[];
  balls = [];

  private frameId: number = null;
  controls: any;

  public constructor(
    private ngZone: NgZone
  ) {}

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
      // alpha: true, // transparent background
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
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-1, -1, -2);
    this.scene.add(light);

    /* Grid */
    const planeMat = new THREE.MeshLambertMaterial({
      opacity: 0.1,
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
      plane.position.set(1.5, i, 1.5);
      plane.rotateX(Math.PI / 2);
    }
    for (let i = 0; i < 4; i++) {
      const plane = new THREE.Mesh(planeGeom, planeMat);
      this.scene.add(plane);
      plane.position.set(i, 1.5, 1.5);
      plane.rotateY(Math.PI / 2);
    }

    /* Origin dot */
    const dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    dotGeometry.vertices.push(new THREE.Vector3(1.5, 1.5, 1.5));
    const dotMaterial = new THREE.PointsMaterial({ size: .05, color: 0xffffff });
    const dot = new THREE.Points(dotGeometry, dotMaterial);
    this.scene.add(dot);
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

      // this.canvas.addEventListener('mousemove', )

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    this.controls.update();
    if (this.updateFns?.length) {
      this.updateFns.forEach((fn) => fn());
    }

    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public updateGrid(grid: number[][][]) {
    console.log('updateGrid', grid);

    this.balls.forEach(ball => {
      this.scene.remove(ball);
    });
    this.balls = [];

    const geometry = new THREE.SphereGeometry(.5, 32, 32);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const val = grid[x][y][z];
          if (val !== -1) {
            let color;
            if (val === 0) color = 0xff0000;
            else if (val === 1) color = 0x00ff00;
            else if (val === 2) color = 0x0000ff;

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
