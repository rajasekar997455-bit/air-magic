import * as THREE from 'three';
import { ParticleSystem } from '../graphics/ParticleSystem';

export class LightningEffect {
  private group: THREE.Group;
  private lineSegments: THREE.LineSegments;
  private geometry: THREE.BufferGeometry;
  private material: THREE.LineBasicMaterial;
  public isActive = false;
  private age = 0;
  private duration = 0.6; // Quick electric strike
  private maxVertices = 600;
  private positions: Float32Array;
  private colors: Float32Array;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.positions = new Float32Array(this.maxVertices * 3);
    this.colors = new Float32Array(this.maxVertices * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage)
    );

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    this.lineSegments = new THREE.LineSegments(this.geometry, this.material);
    this.group.add(this.lineSegments);
    this.group.visible = false;
    scene.add(this.group);
  }

  strike(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    particleSystem: ParticleSystem
  ) {
    this.isActive = true;
    this.age = 0;
    this.group.visible = true;

    // Generate lightning bolts
    this.generateLightningBranches(start, end);

    // Emit impact sparks at end
    particleSystem.emitBurst(
      end,
      35,
      { r: 0.7, g: 0.9, b: 1.0 },
      10,
      0.2,
      25,
      0.8
    );
  }

  private generateLightningBranches(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number }
  ) {
    let vertexIndex = 0;

    const addSegment = (
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number },
      intensity: number
    ) => {
      if (vertexIndex >= this.maxVertices - 2) return;

      const i1 = vertexIndex * 3;
      const i2 = (vertexIndex + 1) * 3;

      this.positions[i1] = p1.x;
      this.positions[i1 + 1] = p1.y;
      this.positions[i1 + 2] = p1.z;

      this.positions[i2] = p2.x;
      this.positions[i2 + 1] = p2.y;
      this.positions[i2 + 2] = p2.z;

      // Electric cyan / white
      const r = 0.5 + 0.5 * intensity;
      const g = 0.8 + 0.2 * intensity;
      const b = 1.0;

      this.colors[i1] = r;
      this.colors[i1 + 1] = g;
      this.colors[i1 + 2] = b;

      this.colors[i2] = r;
      this.colors[i2 + 1] = g;
      this.colors[i2 + 2] = b;

      vertexIndex += 2;
    };

    const branch = (
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number },
      depth: number,
      displacement: number
    ) => {
      if (depth <= 0) {
        addSegment(p1, p2, 1.0);
        return;
      }

      const mid = {
        x: (p1.x + p2.x) / 2 + (Math.random() - 0.5) * displacement,
        y: (p1.y + p2.y) / 2 + (Math.random() - 0.5) * displacement,
        z: (p1.z + p2.z) / 2 + (Math.random() - 0.5) * displacement * 0.5,
      };

      branch(p1, mid, depth - 1, displacement * 0.55);
      branch(mid, p2, depth - 1, displacement * 0.55);

      // Random side fork
      if (Math.random() < 0.4 && depth >= 2) {
        const forkEnd = {
          x: mid.x + (Math.random() - 0.5) * displacement * 1.5,
          y: mid.y + (Math.random() - 0.5) * displacement * 1.5,
          z: mid.z + (Math.random() - 0.5) * displacement * 0.5,
        };
        branch(mid, forkEnd, depth - 2, displacement * 0.4);
      }
    };

    branch(start, end, 5, 1.2);

    // Clear remainder
    for (let i = vertexIndex * 3; i < this.maxVertices * 3; i++) {
      this.positions[i] = 0;
      this.colors[i] = 0;
    }

    this.geometry.setDrawRange(0, vertexIndex);
    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  update(dt: number) {
    if (!this.isActive) return;

    this.age += dt;
    if (this.age >= this.duration) {
      this.isActive = false;
      this.group.visible = false;
      return;
    }

    // Flicker opacity
    const fade = 1.0 - this.age / this.duration;
    this.material.opacity = fade * (Math.random() > 0.3 ? 1.0 : 0.4);
  }
}
