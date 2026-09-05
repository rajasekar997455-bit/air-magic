import * as THREE from 'three';
import {
  createFlowerModel,
  type FlowerMeshes,
  type PerchSlot,
} from './FlowerAnatomy';
import {
  petalVertexShader,
  petalFragmentShader,
  nectarVertexShader,
  nectarFragmentShader,
  stemFragmentShader,
} from './FlowerShaders';

export type FlowerState =
  | 'BUD'
  | 'BLOOMING'
  | 'BLOOMED'
  | 'NECTAR_ACTIVE'
  | 'NECTAR_DEPLETING'
  | 'DEPLETED'
  | 'DISSOLVING'
  | 'REMOVED';

export interface FlowerTheme {
  name: string;
  baseColor: THREE.Color;
  petalColor: THREE.Color;
  tipColor: THREE.Color;
  nectarColor: THREE.Color;
  stemColor: THREE.Color;
}

export const FLOWER_THEMES: FlowerTheme[] = [
  // 1. CELESTIAL AMETHYST LOTUS
  {
    name: 'Amethyst Lotus',
    baseColor: new THREE.Color('#102a18'),
    petalColor: new THREE.Color('#9333ea'),
    tipColor: new THREE.Color('#f472b6'),
    nectarColor: new THREE.Color('#38bdf8'),
    stemColor: new THREE.Color('#064e3b'),
  },
  // 2. SOLAR SUNBURST ORCHID
  {
    name: 'Sunburst Orchid',
    baseColor: new THREE.Color('#2d1a04'),
    petalColor: new THREE.Color('#f59e0b'),
    tipColor: new THREE.Color('#fef08a'),
    nectarColor: new THREE.Color('#fbbf24'),
    stemColor: new THREE.Color('#14532d'),
  },
  // 3. ELECTRIC CYAN WATERLILY
  {
    name: 'Cyan Waterlily',
    baseColor: new THREE.Color('#022c22'),
    petalColor: new THREE.Color('#06b6d4'),
    tipColor: new THREE.Color('#a5f3fc'),
    nectarColor: new THREE.Color('#a855f7'),
    stemColor: new THREE.Color('#064e3b'),
  },
];

export class HolographicFlower {
  public id: number;
  public state: FlowerState = 'BUD';
  public position = new THREE.Vector3();
  public meshes: FlowerMeshes;
  public theme: FlowerTheme;

  // Nectar mechanics
  public nectarLevel = 1.0; // 1.0 = 100% full, 0.0 = depleted
  public isBeingFedOn = false;
  public feedingCount = 0;

  // Lifecycle
  public age = 0;
  public maxAge = 40.0; // 40 seconds lifespan
  private bloomProgress = 0.0; // 0 (bud) to 1 (bloomed)
  private dissolveProgress = 1.0; // 1 (solid) to 0 (dissolved)

  // Uniform references
  private petalUniforms: Record<string, { value: unknown }>;
  private nectarUniforms: Record<string, { value: unknown }>;
  private stemUniforms: Record<string, { value: unknown }>;

  // Reusable matrix / vector math
  private tempVec = new THREE.Vector3();
  private tempQuat = new THREE.Quaternion();

  constructor(id: number, scene: THREE.Scene, origin: THREE.Vector3, themeIndex: number = 0) {
    this.id = id;
    this.position.copy(origin);
    this.theme = FLOWER_THEMES[themeIndex % FLOWER_THEMES.length];

    // Uniforms
    this.petalUniforms = {
      uTime: { value: 0 },
      uBaseColor: { value: this.theme.baseColor },
      uPetalColor: { value: this.theme.petalColor },
      uTipColor: { value: this.theme.tipColor },
      uNectarColor: { value: this.theme.nectarColor },
      uNectarPulse: { value: 0 },
      uProgress: { value: 1.0 },
      uHoloIntensity: { value: 1.0 },
    };

    this.nectarUniforms = {
      uTime: { value: 0 },
      uNectarColor: { value: this.theme.nectarColor },
      uNectarLevel: { value: 1.0 },
      uProgress: { value: 1.0 },
    };

    this.stemUniforms = {
      uStemColor: { value: this.theme.stemColor },
      uProgress: { value: 1.0 },
    };

    const petalMat = new THREE.ShaderMaterial({
      vertexShader: petalVertexShader,
      fragmentShader: petalFragmentShader,
      uniforms: this.petalUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const nectarMat = new THREE.ShaderMaterial({
      vertexShader: nectarVertexShader,
      fragmentShader: nectarFragmentShader,
      uniforms: this.nectarUniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const stemMat = new THREE.ShaderMaterial({
      vertexShader: petalVertexShader,
      fragmentShader: stemFragmentShader,
      uniforms: this.stemUniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.meshes = createFlowerModel(petalMat, petalMat, nectarMat, stemMat);
    this.meshes.rootGroup.position.copy(origin);
    // Subtle organic tilt
    this.meshes.rootGroup.rotation.x = 0.12;
    this.meshes.rootGroup.rotation.z = -0.08;

    scene.add(this.meshes.rootGroup);
    this.state = 'BLOOMING';
  }

  /**
   * Main per-frame update for flower blooming, nectar depletion, and perch slots
   */
  update(dt: number, totalTime: number) {
    if (this.state === 'REMOVED') return;

    this.age += dt;
    this.petalUniforms.uTime.value = totalTime;
    this.nectarUniforms.uTime.value = totalTime;

    // ── 1. Organic Spring Bloom Solver ──
    if (this.state === 'BLOOMING' || this.state === 'BUD') {
      this.bloomProgress = Math.min(1.0, this.bloomProgress + dt * 0.45);
      if (this.bloomProgress >= 1.0) {
        this.state = 'NECTAR_ACTIVE';
      }
    }

    // Solve individual petal spring physics with progressive opening delays
    const springK = 18.0;
    const damping = 0.82;
    for (let i = 0; i < this.meshes.petals.length; i++) {
      const p = this.meshes.petals[i];
      // Target angle based on bloom progress and individual petal delay
      const effProgress = Math.max(0.0, (this.bloomProgress - p.openDelay) / Math.max(0.01, 1.0 - p.openDelay));
      const targetAngle = 0.08 + effProgress * (p.maxOpenAngle - 0.08);

      // Spring acceleration
      const diff = targetAngle - p.currentOpenAngle;
      const accel = diff * springK;
      p.openVelocity = (p.openVelocity + accel * dt) * damping;
      p.currentOpenAngle += p.openVelocity * dt;

      // Subtle ambient living breathing oscillation (keeps flower organically alive)
      const breathing = Math.sin(totalTime * 1.6 + i * 0.5) * 0.015;
      p.group.rotation.x = p.currentOpenAngle + breathing;
    }

    // ── 2. Nectar Depletion & Feeding Pulse ──
    this.feedingCount = this.meshes.perchSlots.filter((s) => s.isOccupied).length;
    this.isBeingFedOn = this.feedingCount > 0;

    if (this.isBeingFedOn) {
      // Nectar consumption rate: consumes ~4% per second per butterfly
      this.nectarLevel = Math.max(0.0, this.nectarLevel - dt * 0.035 * this.feedingCount);
      (this.petalUniforms.uNectarPulse.value as number) = Math.min(
        1.0,
        (this.petalUniforms.uNectarPulse.value as number) + dt * 3.0
      );

      if (this.nectarLevel <= 0.0 && this.state !== 'DEPLETED') {
        this.state = 'DEPLETED';
      } else if (this.nectarLevel < 0.35 && this.state === 'NECTAR_ACTIVE') {
        this.state = 'NECTAR_DEPLETING';
      }
    } else {
      (this.petalUniforms.uNectarPulse.value as number) = Math.max(
        0.0,
        (this.petalUniforms.uNectarPulse.value as number) - dt * 2.0
      );
    }

    this.nectarUniforms.uNectarLevel.value = this.nectarLevel;

    // ── 3. Perch Slot World Transforms Calculation ──
    this.meshes.rootGroup.updateMatrixWorld(true);
    for (const slot of this.meshes.perchSlots) {
      const petal = this.meshes.petals[slot.petalIndex];
      // Landing spot at 65% of petal length on the upper curved surface
      const localLanding = this.tempVec.set(0, 0.02, petal.length * 0.65);
      petal.group.localToWorld(localLanding);
      slot.worldPosition.copy(localLanding);

      // Compute outward surface normal for body alignment
      slot.surfaceNormal.set(0, 1, 0).applyQuaternion(petal.group.getWorldQuaternion(this.tempQuat)).normalize();
      // Facing tangent toward the central nectar pool
      slot.headingTangent.subVectors(this.position, slot.worldPosition).setY(0).normalize();
    }

    // ── 4. Natural Lifecycle & Dissolve ──
    if (this.age > this.maxAge || this.state === 'DEPLETED') {
      // Only dissolve if no butterfly is actively feeding right now!
      if (!this.isBeingFedOn) {
        this.state = 'DISSOLVING';
      }
    }

    if (this.state === 'DISSOLVING') {
      this.dissolveProgress = Math.max(0.0, this.dissolveProgress - dt * 0.45);
      this.petalUniforms.uProgress.value = this.dissolveProgress;
      this.nectarUniforms.uProgress.value = this.dissolveProgress;
      this.stemUniforms.uProgress.value = this.dissolveProgress;

      if (this.dissolveProgress <= 0.0) {
        this.state = 'REMOVED';
        this.meshes.rootGroup.visible = false;
      }
    }
  }

  /**
   * Attempts to reserve a perch slot for a butterfly
   */
  reserveSlot(butterflyId: number): PerchSlot | null {
    if (this.state === 'DEPLETED' || this.state === 'DISSOLVING' || this.state === 'REMOVED') {
      return null;
    }
    const freeSlot = this.meshes.perchSlots.find((s) => !s.isOccupied);
    if (!freeSlot) return null;

    freeSlot.isOccupied = true;
    freeSlot.occupantId = butterflyId;
    return freeSlot;
  }

  /**
   * Releases a perch slot when a butterfly takes off
   */
  releaseSlot(slotIndex: number) {
    const slot = this.meshes.perchSlots.find((s) => s.slotIndex === slotIndex);
    if (slot) {
      slot.isOccupied = false;
      slot.occupantId = null;
    }
  }

  /**
   * Cleans up Three.js resources
   */
  dispose(scene: THREE.Scene) {
    scene.remove(this.meshes.rootGroup);
    this.state = 'REMOVED';
  }
}
