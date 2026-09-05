import * as THREE from 'three';
import { trailVertexShader, trailFragmentShader } from './shaders/particleShaders';
import type { DrawingMode } from '../types';

export class TrailSystem {
  private maxPoints = 250;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  public mesh: THREE.Mesh;

  private positions: Float32Array;
  private colors: Float32Array;
  private alphas: Float32Array;

  private pointsList: Array<{
    pos: THREE.Vector3;
    age: number;
    maxAge: number;
    color: THREE.Color;
    width: number;
  }> = [];

  private colorMap: Record<DrawingMode, THREE.Color> = {
    PEN: new THREE.Color(0.2, 0.9, 1.0),
    PARTICLE: new THREE.Color(1.0, 0.7, 0.2),
    ENERGY: new THREE.Color(0.3, 1.0, 0.6),
    FIRE: new THREE.Color(1.0, 0.4, 0.1),
    GALAXY: new THREE.Color(0.8, 0.3, 1.0),
  };

  constructor(scene: THREE.Scene) {
    // Ribbon uses a triangle strip: 2 vertices per trail segment -> maxPoints * 2 vertices
    const vertexCount = this.maxPoints * 2;
    this.positions = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 3);
    this.alphas = new Float32Array(vertexCount);

    // Triangle indices
    const indices: number[] = [];
    for (let i = 0; i < this.maxPoints - 1; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;

      indices.push(v0, v1, v2);
      indices.push(v2, v1, v3);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setIndex(indices);
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.geometry.setAttribute(
      'aColor',
      new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.geometry.setAttribute(
      'aAlpha',
      new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage)
    );

    this.material = new THREE.ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  addPoint(pos: { x: number; y: number; z: number }, mode: DrawingMode, isDrawing: boolean) {
    if (!isDrawing) return;

    const baseColor = this.colorMap[mode] || this.colorMap.PEN;
    const newPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    const last = this.pointsList[this.pointsList.length - 1];
    if (!last || last.pos.distanceTo(newPos) > 0.02) {
      this.pointsList.push({
        pos: newPos,
        age: 0,
        maxAge: 1.2, // seconds
        color: baseColor.clone(),
        width: 0.12,
      });

      if (this.pointsList.length > this.maxPoints) {
        this.pointsList.shift();
      }
    }
  }

  update(dt: number) {
    // Age existing points
    for (let i = this.pointsList.length - 1; i >= 0; i--) {
      this.pointsList[i].age += dt;
      if (this.pointsList[i].age >= this.pointsList[i].maxAge) {
        this.pointsList.splice(i, 1);
      }
    }

    const n = this.pointsList.length;
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('aColor') as THREE.BufferAttribute;
    const alpAttr = this.geometry.getAttribute('aAlpha') as THREE.BufferAttribute;

    const posArray = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;
    const alpArray = alpAttr.array as Float32Array;

    if (n < 2) {
      alpArray.fill(0);
      alpAttr.needsUpdate = true;
      return;
    }

    // Build ribbon vertices with perpendicular tangents
    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);

    for (let i = 0; i < n; i++) {
      const curr = this.pointsList[i];
      const prev = this.pointsList[Math.max(0, i - 1)];
      const next = this.pointsList[Math.min(n - 1, i + 1)];

      forward.subVectors(next.pos, prev.pos).normalize();
      if (forward.lengthSq() < 0.001) forward.set(1, 0, 0);

      side.crossVectors(forward, up).normalize();

      const progress = curr.age / curr.maxAge;
      const alpha = Math.max(0, 1.0 - progress);
      const taper = (1.0 - progress) * curr.width;

      const v0Idx = i * 2 * 3;
      const v1Idx = (i * 2 + 1) * 3;

      // Left vertex
      posArray[v0Idx] = curr.pos.x + side.x * taper;
      posArray[v0Idx + 1] = curr.pos.y + side.y * taper;
      posArray[v0Idx + 2] = curr.pos.z + side.z * taper;

      // Right vertex
      posArray[v1Idx] = curr.pos.x - side.x * taper;
      posArray[v1Idx + 1] = curr.pos.y - side.y * taper;
      posArray[v1Idx + 2] = curr.pos.z - side.z * taper;

      // Color
      colArray[v0Idx] = curr.color.r;
      colArray[v0Idx + 1] = curr.color.g;
      colArray[v0Idx + 2] = curr.color.b;

      colArray[v1Idx] = curr.color.r;
      colArray[v1Idx + 1] = curr.color.g;
      colArray[v1Idx + 2] = curr.color.b;

      // Alpha
      alpArray[i * 2] = alpha;
      alpArray[i * 2 + 1] = alpha;
    }

    // Zero out unused vertex alphas
    for (let i = n * 2; i < this.maxPoints * 2; i++) {
      alpArray[i] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    alpAttr.needsUpdate = true;
  }

  clear() {
    this.pointsList = [];
    const alpAttr = this.geometry.getAttribute('aAlpha') as THREE.BufferAttribute;
    (alpAttr.array as Float32Array).fill(0);
    alpAttr.needsUpdate = true;
  }
}
