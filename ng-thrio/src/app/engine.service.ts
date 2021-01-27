import { ElementRef, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { RoomPublic } from '../../../Interfaces';
import { RoomService } from './room.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class EngineService implements OnDestroy {
  private graphics =
    this.authService.prefs?.graphics === undefined
      ? 1
      : this.authService.prefs.graphics;

  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  public scene: THREE.Scene;

  private balls: THREE.Mesh[] = [];
  private selectors = [];

  private frameId: number = null;
  private controls: any;
  private mouse = new THREE.Vector2();
  private clock = new THREE.Clock();
  private lastMove: { x: number; y: number; z: number };
  lastSelect: { x: number; z: number, selector: THREE.Mesh };

  selectorMat = new THREE.MeshPhongMaterial({
    opacity: 0.3,
    color: 0xffffff,
    specular: 0xffffff,
    blending: THREE.AdditiveBlending,
  });
  selectorActiveMat = new THREE.MeshPhongMaterial({
    opacity: 1,
    color: 0xffffff,
  });

  public constructor(
    private ngZone: NgZone,
    private rs: RoomService,
    private authService: AuthService
  ) {
    this.rs.room$.subscribe((room) => {
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
      antialias: this.graphics > 0, // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    /* Scene */
    this.scene = new THREE.Scene();
    // this.scene.fog = new THREE.Fog(0x00aaff, 8, 14);
    // this.scene.background = new THREE.Color( 0xaaaaaa );

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      20
    );
    this.camera.position.y = 4;
    this.camera.position.z = 10;
    this.scene.add(this.camera);

    // this.composer = new EffectComposer( this.renderer );
    // const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
    // ssaoPass.kernelRadius = 1;
    // ssaoPass.minDistance = 0.00088;
    // ssaoPass.maxDistance = 0.016;
    // this.composer.addPass(ssaoPass);

    /* Orbit controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(1.5, 1.5, 1.5);
    this.controls.autoRotateSpeed = -0.1;
    this.controls.autoRotate = true;
    this.controls.enableKeys = true;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.update();

    // try {
    //   const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    //   if (gl) {
    //     const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    //     console.log('2', debugInfo);
    //     console.log('2', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
    //     console.log('2', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    //   }
    // } catch (e) {
    //   console.error(e);
    // }

    /* Lighting */
    let light: THREE.Light = new THREE.DirectionalLight(0xffffff, 1);
    light.castShadow = true;
    light.position.set(-1, 15, 1);
    const shadowMapSize = this.graphics > 1 ? 512 : 215;
    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;
    this.scene.add(light);

    light = new THREE.HemisphereLight(0xffffff, 0xe0c492, 0.4);
    light.position.set(1, -3, -2);
    this.scene.add(light);
    light = new THREE.PointLight(0xffffff, 0.2);
    light.position.set(5, 5, 5);
    this.scene.add(light);

    /* Grid */
    const planeMat = new THREE.MeshPhongMaterial({
      shininess: 100,
      opacity: 0.05,
      color: 0xffffff,
      specular: 0xffffff,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
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

    /* Origin axis lines */
    const lineMat = new THREE.LineBasicMaterial({ linewidth: 1, color: 0xaaaaaa });
    let line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.25, 0, 0)]), lineMat);
    this.scene.add(line);
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.25, 0)]), lineMat);
    this.scene.add(line);
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.25)]), lineMat);
    this.scene.add(line);
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
        if (intersect.object.userData?.selector) {
          const x = intersect.object.userData.selector.x;
          const z = intersect.object.userData.selector.z;

          if (
            !this.authService.prefs.doubleTap ||
            (this.lastSelect?.x === x && this.lastSelect.z === z)
          ) {
            delete this.lastSelect;
            this.rs.makeMove({ x, z });
          } else {
            if (this.lastSelect) this.lastSelect.selector.material = this.selectorMat;
            this.lastSelect = { x, z, selector: (intersect.object as THREE.Mesh) };
            (intersect.object as THREE.Mesh).material = this.selectorActiveMat;
          }
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

    //  ender();
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

    this.renderer.render(this.scene, this.camera);
  }

  public async onRoom(room: RoomPublic): Promise<void> {
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

            const material =
              this.graphics > 1
                ? new THREE.MeshStandardMaterial({
                    color,
                    envMap: (
                      await new THREE.TextureLoader()
                        .loadAsync('assets/equirectangular.png')
                        .then((texture: THREE.Texture) => {
                          const pmremGenerator = new THREE.PMREMGenerator(
                            this.renderer
                          );
                          pmremGenerator.compileEquirectangularShader();
                          texture.encoding = THREE.sRGBEncoding;
                          const envMap = pmremGenerator.fromEquirectangular(
                            texture
                          );
                          texture.dispose();
                          return envMap;
                        })
                    ).texture,
                    envMapIntensity: 1,
                    metalness: 0.1,
                    roughness: 0.1,
                  })
                : new THREE.MeshPhongMaterial({
                    color,
                    shininess: 50,
                  });

            const sphere = new THREE.Mesh(ballGeom, material);
            this.scene.add(sphere);
            sphere.userData = { x, y, z };
            sphere.position.set(x + 0.5, y + 0.5, z + 0.5);
            sphere.rotation.set(
              Math.random() * 365,
              Math.random() * 365,
              Math.random() * 365
            );
            sphere.castShadow = this.graphics > 0;
            sphere.receiveShadow = this.graphics > 0;
            this.balls.push(sphere);

            if (
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
    if (this.rs.isNextPlayer) {
      const selectorGeom = new THREE.ConeGeometry(0.3, 0.3, 4, 1);
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          if (room.grid[x][2][z] === -1) {
            const selector = new THREE.Mesh(selectorGeom, this.selectorMat);
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
