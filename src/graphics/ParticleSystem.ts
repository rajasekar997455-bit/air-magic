import * as THREE from 'three';
import { particleVertexShader, particleFragmentShader } from './shaders/particleShaders';
import type { PerformanceTier, DrawingMode, SharedInteractionState } from '../types';

export class ParticleSystem {
  public maxParticles: number = 10000;
  public activeCount: number = 0;

  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  public points: THREE.Points;

  // GPU Buffers
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;

  // CPU Simulation state
  private velocities: Float32Array;
  private lifeTimes: Float32Array;
  private maxLifeTimes: Float32Array;
  private targetPositions: Float32Array;
  private hasTargets: Uint8Array;
  private particleTypes: Uint8Array; // 0=normal, 1=flame, 2=galaxy, 3=spark, 4=energy

  private posAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;
  private alphaAttr: THREE.BufferAttribute;

  private nextEmitIndex: number = 0;
  private currentLimit: number = 6000; // Matches HIGH tier default
  private tierLimits: Record<PerformanceTier, number> = {
    HIGH: 6000,
    MEDIUM: 3000,
    LOW: 1000,
  };

  constructor(scene: THREE.Scene, maxParticles = 10000) {
    this.maxParticles = maxParticles;

    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);
    this.alphas = new Float32Array(maxParticles);

    this.velocities = new Float32Array(maxParticles * 3);
    this.lifeTimes = new Float32Array(maxParticles);
    this.maxLifeTimes = new Float32Array(maxParticles);
    this.targetPositions = new Float32Array(maxParticles * 3);
    this.hasTargets = new Uint8Array(maxParticles);
    this.particleTypes = new Uint8Array(maxParticles);

    // Initialize geometry
    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttr = new THREE.BufferAttribute(this.colors, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1);
    this.alphaAttr = new THREE.BufferAttribute(this.alphas, 1);

    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.alphaAttr.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aColor', this.colorAttr);
    this.geometry.setAttribute('aSize', this.sizeAttr);
    this.geometry.setAttribute('aAlpha', this.alphaAttr);

    // Initialize shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  setPixelRatio(dpr: number) {
    this.material.uniforms.uPixelRatio.value = dpr;
  }

  emitParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    r: number,
    g: number,
    b: number,
    size: number,
    life: number,
    type: number = 0,
    target?: { x: number; y: number; z: number }
  ) {
    // Cap emit index to the current active limit so update() always processes these particles
    const limit = this.currentLimit;
    const idx = this.nextEmitIndex;
    this.nextEmitIndex = (this.nextEmitIndex + 1) % limit;

    const i3 = idx * 3;
    this.positions[i3] = x;
    this.positions[i3 + 1] = y;
    this.positions[i3 + 2] = z;

    this.velocities[i3] = vx;
    this.velocities[i3 + 1] = vy;
    this.velocities[i3 + 2] = vz;

    this.colors[i3] = r;
    this.colors[i3 + 1] = g;
    this.colors[i3 + 2] = b;

    this.sizes[idx] = size;
    this.alphas[idx] = 1.0;
    this.lifeTimes[idx] = life;
    this.maxLifeTimes[idx] = life;
    this.particleTypes[idx] = type;

    if (target) {
      this.targetPositions[i3] = target.x;
      this.targetPositions[i3 + 1] = target.y;
      this.targetPositions[i3 + 2] = target.z;
      this.hasTargets[idx] = 1;
    } else {
      this.hasTargets[idx] = 0;
    }
  }

  emitBurst(
    origin: { x: number; y: number; z: number },
    count: number,
    color: { r: number; g: number; b: number },
    speed = 5,
    spread = 1,
    size = 18,
    life = 2.0
  ) {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const spd = (0.5 + Math.random() * 0.5) * speed;

      const vx = Math.sin(phi) * Math.cos(theta) * spd;
      const vy = Math.sin(phi) * Math.sin(theta) * spd;
      const vz = Math.cos(phi) * spd * 0.5;

      const ox = origin.x + (Math.random() - 0.5) * spread;
      const oy = origin.y + (Math.random() - 0.5) * spread;
      const oz = origin.z + (Math.random() - 0.5) * spread * 0.5;

      // Subtle color jitter
      const cr = Math.min(1.0, color.r * (0.8 + Math.random() * 0.4));
      const cg = Math.min(1.0, color.g * (0.8 + Math.random() * 0.4));
      const cb = Math.min(1.0, color.b * (0.8 + Math.random() * 0.4));

      this.emitParticle(ox, oy, oz, vx, vy, vz, cr, cg, cb, size, life + Math.random() * 0.5);
    }
  }

  emitFingertipStream(
    pos: { x: number; y: number; z: number },
    mode: DrawingMode,
    count = 3
  ) {
    let r = 0.4, g = 0.8, b = 1.0;
    let size = 15;
    let life = 1.2;
    let type = 0;

    switch (mode) {
      case 'PEN':
        r = 0.3; g = 0.9; b = 1.0; size = 14; life = 1.4;
        break;
      case 'PARTICLE':
        r = 1.0; g = 0.7; b = 0.2; size = 18; life = 1.8;
        break;
      case 'ENERGY':
        r = 0.4; g = 1.0; b = 0.5; size = 22; life = 1.0; type = 4;
        break;
      case 'FIRE':
        r = 1.0; g = 0.4; b = 0.1; size = 20; life = 1.3; type = 1;
        break;
      case 'GALAXY':
        r = 0.8; g = 0.3; b = 1.0; size = 18; life = 2.2; type = 2;
        break;
    }

    for (let i = 0; i < count; i++) {
      const spread = 0.08;
      const ox = pos.x + (Math.random() - 0.5) * spread;
      const oy = pos.y + (Math.random() - 0.5) * spread;
      const oz = pos.z + (Math.random() - 0.5) * spread * 0.5;

      const vx = (Math.random() - 0.5) * 0.6;
      const vy = (Math.random() - 0.5) * 0.6 + (type === 1 ? 1.5 : 0);
      const vz = (Math.random() - 0.5) * 0.4;

      this.emitParticle(ox, oy, oz, vx, vy, vz, r, g, b, size, life, type);
    }
  }

  emitPinchOrb(center: { x: number; y: number; z: number }, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.15 + Math.random() * 0.35;
      const ox = center.x + Math.cos(angle) * rad;
      const oy = center.y + Math.sin(angle) * rad;
      const oz = center.z + (Math.random() - 0.5) * 0.2;

      const vx = -Math.sin(angle) * 1.5 - Math.cos(angle) * 0.8;
      const vy = Math.cos(angle) * 1.5 - Math.sin(angle) * 0.8;
      const vz = (Math.random() - 0.5) * 0.4;

      this.emitParticle(
        ox, oy, oz, vx, vy, vz,
        0.3 + Math.random() * 0.3,
        0.8 + Math.random() * 0.2,
        1.0,
        22 + Math.random() * 10,
        0.6,
        4
      );
    }
  }

  /**
   * Emits an expanding luminous shockwave ring radiating outward from the hand position.
   * Triggered once on OPEN_PALM onset.
   */
  emitShockwaveRing(origin: { x: number; y: number; z: number }, count = 60) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const speed = 7.5 + Math.random() * 2.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const vz = (Math.random() - 0.5) * 0.4;

      // Cyan-white luminous high-energy burst
      const isCore = Math.random() > 0.4;
      this.emitParticle(
        origin.x + Math.cos(angle) * 0.25,
        origin.y + Math.sin(angle) * 0.25,
        origin.z,
        vx, vy, vz,
        isCore ? 0.9 : 0.2,
        isCore ? 1.0 : 0.85,
        1.0,
        isCore ? 24 : 18,
        0.75 + Math.random() * 0.25,
        4 // Energy type
      );
    }
  }

  /**
   * Emits inward-whirling vortex particles spiraling into the fist center.
   * Active during FIST hold after ~0.4s charge.
   */
  emitGravityStorm(center: { x: number; y: number; z: number }, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.2 + Math.random() * 2.2;
      const ox = center.x + Math.cos(angle) * dist;
      const oy = center.y + Math.sin(angle) * dist;
      const oz = center.z + (Math.random() - 0.5) * 0.8;

      // Tangential swirl + strong inward attraction velocity
      const tangentX = -Math.sin(angle) * 3.5;
      const tangentY = Math.cos(angle) * 3.5;
      const inwardX = -Math.cos(angle) * 4.0;
      const inwardY = -Math.sin(angle) * 4.0;

      // Deep cosmic violet / indigo / cyan event-horizon color
      const isViolet = Math.random() > 0.35;
      this.emitParticle(
        ox, oy, oz,
        tangentX + inwardX,
        tangentY + inwardY,
        (Math.random() - 0.5) * 0.5,
        isViolet ? 0.65 : 0.1,
        isViolet ? 0.2 : 0.9,
        1.0,
        18 + Math.random() * 8,
        0.5 + Math.random() * 0.3,
        2 // Galaxy/singularity swirl type
      );
    }
  }

  update(dt: number, state: SharedInteractionState) {
    this.material.uniforms.uTime.value += dt;

    const limit = this.tierLimits[state.tier] || this.maxParticles;
    this.currentLimit = limit; // Keep currentLimit in sync with update loop
    let active = 0;

    const handPos = state.worldFingertip;
    const gesture = state.gesture;

    for (let i = 0; i < limit; i++) {
      if (this.lifeTimes[i] <= 0) {
        this.alphas[i] = 0;
        continue;
      }

      active++;
      this.lifeTimes[i] -= dt;
      const progress = 1.0 - this.lifeTimes[i] / this.maxLifeTimes[i];
      const i3 = i * 3;

      const pType = this.particleTypes[i];

      // Target seeking
      if (this.hasTargets[i] === 1) {
        const tx = this.targetPositions[i3];
        const ty = this.targetPositions[i3 + 1];
        const tz = this.targetPositions[i3 + 2];

        const dx = tx - this.positions[i3];
        const dy = ty - this.positions[i3 + 1];
        const dz = tz - this.positions[i3 + 2];

        this.velocities[i3] += dx * 8.0 * dt;
        this.velocities[i3 + 1] += dy * 8.0 * dt;
        this.velocities[i3 + 2] += dz * 8.0 * dt;

        this.velocities[i3] *= 0.88;
        this.velocities[i3 + 1] *= 0.88;
        this.velocities[i3 + 2] *= 0.88;
      } else {
        // Gesture interactive fields
        if (state.handDetected || state.isDemoMode || state.isDrawing) {
          const dx = handPos.x - this.positions[i3];
          const dy = handPos.y - this.positions[i3 + 1];
          const distSq = dx * dx + dy * dy + 0.01;
          const dist = Math.sqrt(distSq);

          // ✊ FIST: Gravity storm only active after ~0.4s hold behavior
          if (gesture === 'FIST' && state.fistHoldTime >= 0.4) {
            const force = 32.0 / Math.max(0.18, distSq);
            this.velocities[i3] += (dx / dist) * force * dt;
            this.velocities[i3 + 1] += (dy / dist) * force * dt;
          } else if (gesture === 'OPEN_PALM') {
            if (dist < 4.0) {
              const force = (4.0 - dist) * 25.0;
              this.velocities[i3] -= (dx / dist) * force * dt;
              this.velocities[i3 + 1] -= (dy / dist) * force * dt;
            }
          }
        }

        // Fire
        if (pType === 1) {
          this.velocities[i3 + 1] += 3.5 * dt;
          this.velocities[i3] += (Math.random() - 0.5) * 2.0 * dt;
          this.colors[i3] = 1.0;
          this.colors[i3 + 1] = Math.max(0.1, 0.9 - progress * 0.8);
          this.colors[i3 + 2] = Math.max(0.0, 0.2 - progress * 0.2);
        }

        // Galaxy
        if (pType === 2) {
          const rx = this.positions[i3];
          const ry = this.positions[i3 + 1];
          this.velocities[i3] += -ry * 1.5 * dt;
          this.velocities[i3 + 1] += rx * 1.5 * dt;
        }

        this.velocities[i3] *= 0.97;
        this.velocities[i3 + 1] *= 0.97;
        this.velocities[i3 + 2] *= 0.97;
      }

      this.positions[i3] += this.velocities[i3] * dt;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * dt;

      this.alphas[i] = Math.pow(Math.max(0, 1.0 - progress), 1.5);
    }

    this.activeCount = active;
    state.particleCount = active;

    // Direct GPU Buffer Uploads (60+ FPS smooth)
    this.posAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
  }

  clear() {
    this.alphas.fill(0);
    this.lifeTimes.fill(0);
    this.activeCount = 0;
    this.alphaAttr.needsUpdate = true;
  }
}
