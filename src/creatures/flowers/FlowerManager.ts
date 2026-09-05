import * as THREE from 'three';
import { HolographicFlower } from './HolographicFlower';

/**
 * Flower Manager
 * 
 * Manages active holographic flowers in the 3D scene (max 4 concurrent):
 * - Organic bud sprouting & blooming lifecycle
 * - Nectar reservoir querying for butterflies
 * - Zero performance overhead: pooled and cleaned up automatically
 */
export class FlowerManager {
  private scene: THREE.Scene;
  private flowers: HolographicFlower[] = [];
  private nextId = 0;
  private totalTime = 0;
  public maxFlowers = 4;
  private enabled = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.clearAll();
  }

  toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Spawns a new holographic flower bud in 3D space (only if enabled)
   */
  spawnFlower(origin?: THREE.Vector3, themeIndex?: number): HolographicFlower | null {
    if (!this.enabled) {
      return null;
    }

    const pos = origin ? origin.clone() : new THREE.Vector3(0, -0.2, 0);

    // If max flowers reached, remove the oldest depleted or unvisited flower
    if (this.flowers.length >= this.maxFlowers) {
      const candidateIndex = this.flowers.findIndex((f) => !f.isBeingFedOn);
      if (candidateIndex !== -1) {
        this.flowers[candidateIndex].dispose(this.scene);
        this.flowers.splice(candidateIndex, 1);
      }
    }

    const theme = themeIndex !== undefined ? themeIndex : this.nextId % 3;
    const flower = new HolographicFlower(this.nextId++, this.scene, pos, theme);
    this.flowers.push(flower);
    return flower;
  }

  /**
   * Main per-frame update loop
   */
  update(dt: number) {
    if (!this.enabled && this.flowers.length === 0) {
      return;
    }

    this.totalTime += dt;

    for (let i = this.flowers.length - 1; i >= 0; i--) {
      const f = this.flowers[i];
      f.update(dt, this.totalTime);

      if (f.state === 'REMOVED') {
        f.dispose(this.scene);
        this.flowers.splice(i, 1);
      }
    }
  }

  /**
   * Finds the nearest flower with available nectar and open perch slots
   */
  findFlowerForButterfly(
    butterflyPos: THREE.Vector3,
    maxDistance: number = 6.5
  ): { flower: HolographicFlower; dist: number } | null {
    if (!this.enabled || this.flowers.length === 0) {
      return null;
    }
    let nearest: HolographicFlower | null = null;
    let minDist = maxDistance;

    for (const flower of this.flowers) {
      if (
        flower.state === 'DEPLETED' ||
        flower.state === 'DISSOLVING' ||
        flower.state === 'REMOVED' ||
        flower.nectarLevel <= 0.05
      ) {
        continue;
      }

      // Check if there is an open perch slot
      const hasSlot = flower.meshes.perchSlots.some((s) => !s.isOccupied);
      if (!hasSlot) continue;

      const d = butterflyPos.distanceTo(flower.position);
      if (d < minDist) {
        minDist = d;
        nearest = flower;
      }
    }

    return nearest ? { flower: nearest, dist: minDist } : null;
  }

  /**
   * Returns current active flowers count
   */
  getFlowerCount(): number {
    return this.flowers.length;
  }

  /**
   * Cleans up all active flowers
   */
  clearAll() {
    for (const f of this.flowers) {
      f.dispose(this.scene);
    }
    this.flowers = [];
  }
}
