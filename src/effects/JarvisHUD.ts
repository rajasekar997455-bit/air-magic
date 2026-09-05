import * as THREE from 'three';

export class JarvisHUD {
  private group: THREE.Group;
  private outerRing: THREE.LineLoop;
  private innerRing: THREE.LineLoop;
  private crosshair: THREE.LineSegments;
  public isActive = false;
  private age = 0;
  private duration = 7.0; // Stays active for 7 seconds

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    // Outer segmented ring
    const outerGeo = new THREE.BufferGeometry();
    const outerPoints: number[] = [];
    const segments = 48;
    for (let i = 0; i < segments; i++) {
      if (i % 6 !== 0) {
        const theta = (i / segments) * Math.PI * 2;
        outerPoints.push(Math.cos(theta) * 2.2, Math.sin(theta) * 2.2, 0);
      }
    }
    outerGeo.setAttribute('position', new THREE.Float32BufferAttribute(outerPoints, 3));
    const outerMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.outerRing = new THREE.LineLoop(outerGeo, outerMat);

    // Inner reticle
    const innerGeo = new THREE.BufferGeometry();
    const innerPoints: number[] = [];
    for (let i = 0; i < 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      innerPoints.push(Math.cos(theta) * 1.4, Math.sin(theta) * 1.4, 0);
    }
    innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerPoints, 3));
    const innerMat = new THREE.LineBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.innerRing = new THREE.LineLoop(innerGeo, innerMat);

    // Crosshairs
    const crossGeo = new THREE.BufferGeometry();
    const crossPoints = [
      -2.6, 0, 0, -1.6, 0, 0,
      1.6, 0, 0, 2.6, 0, 0,
      0, -2.6, 0, 0, -1.6, 0,
      0, 1.6, 0, 0, 2.6, 0,
    ];
    crossGeo.setAttribute('position', new THREE.Float32BufferAttribute(crossPoints, 3));
    this.crosshair = new THREE.LineSegments(crossGeo, outerMat);

    this.group.add(this.outerRing, this.innerRing, this.crosshair);
    this.group.visible = false;
    scene.add(this.group);
  }

  activate(pos: { x: number; y: number; z: number }) {
    this.isActive = true;
    this.age = 0;
    this.group.position.set(pos.x, pos.y, pos.z);
    this.group.visible = true;
    this.group.scale.set(0.1, 0.1, 0.1);
  }

  update(
    dt: number,
    handPos: { x: number; y: number; z: number },
    handDetected: boolean
  ) {
    if (!this.isActive) return;

    this.age += dt;
    if (this.age >= this.duration) {
      this.isActive = false;
      this.group.visible = false;
      return;
    }

    if (handDetected) {
      this.group.position.x += (handPos.x - this.group.position.x) * 6.0 * dt;
      this.group.position.y += (handPos.y - this.group.position.y) * 6.0 * dt;
    }

    const fadeIn = Math.min(1.0, this.age / 0.5);
    const fadeOut = Math.max(0.0, (this.duration - this.age) / 1.0);
    const scale = fadeIn * Math.min(1.0, fadeOut);

    this.group.scale.set(scale, scale, scale);

    this.outerRing.rotation.z += 1.2 * dt;
    this.innerRing.rotation.z -= 1.8 * dt;
  }

  deactivate() {
    this.isActive = false;
    this.group.visible = false;
  }
}
