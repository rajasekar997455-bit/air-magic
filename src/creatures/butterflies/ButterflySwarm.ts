import * as THREE from 'three';
import { Butterfly } from './Butterfly';
import type { PerformanceTier, SharedInteractionState } from '../../types';
import type { FlowerManager } from '../flowers/FlowerManager';

/**
 * Enhanced Butterfly Swarm Controller — Free Flight & Ecosystem Nectar Feeding
 * 
 * Features:
 * - Truly independent free flight: butterflies wander freely across the full 3D space
 * - Zero clumping: strong 1.8m personal space bubble, near-zero cohesion
 * - Dynamic flower detection & nectar feeding: autonomous visits, petal perching, drinking & takeoff
 * - Non-conflicting gesture control: gathers to perch only when CROSSED_FINGERS (🤞) is active
 */
export class ButterflySwarm {
  private scene: THREE.Scene;
  private butterflies: Butterfly[] = [];
  public isActive = false;
  private totalTime = 0;
  private swarmCenter = new THREE.Vector3(0, 0, 0);

  // Reusable vectors to prevent GC allocations in 60fps loop
  private vSeparation = new THREE.Vector3();
  private vAlignment = new THREE.Vector3();
  private vWander = new THREE.Vector3();
  private vHand = new THREE.Vector3();
  private vTemp = new THREE.Vector3();

  // Hand interaction tracking
  private prevHandPos = new THREE.Vector3();
  private handVelocity = new THREE.Vector3();
  private handScatterTimer = 0;
  private isHandScattering = false;

  // Tier limits
  private tierCounts: Record<PerformanceTier, number> = {
    HIGH: 32,
    MEDIUM: 20,
    LOW: 12,
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializePool(this.tierCounts.HIGH);
  }

  private initializePool(count: number) {
    for (let i = 0; i < count; i++) {
      const b = new Butterfly(i, this.scene, i % 5);
      this.butterflies.push(b);
    }
  }

  /**
   * Spawns the butterfly swarm freely scattered across the entire 3D viewing volume
   */
  spawn(origin: { x: number; y: number; z: number }, tier: PerformanceTier = 'HIGH') {
    this.isActive = true;
    this.totalTime = 0;
    this.swarmCenter.set(origin.x, origin.y, origin.z);
    this.handScatterTimer = 0;
    this.isHandScattering = false;

    const targetCount = this.tierCounts[tier];

    for (let i = 0; i < this.butterflies.length; i++) {
      const b = this.butterflies[i];
      if (i < targetCount) {
        // Wide 3D dispersion across the full scene
        const spawnPos = new THREE.Vector3(
          origin.x + (Math.random() - 0.5) * 6.5,
          origin.y + (Math.random() - 0.5) * 3.8,
          origin.z + (Math.random() - 0.5) * 3.5 - 0.5
        );
        b.spawn(spawnPos);
      } else {
        b.meshes.rootGroup.visible = false;
        b.state = 'DEAD';
      }
    }
  }

  /**
   * Dissolves the swarm smoothly into holographic ionization particles
   */
  dissolve() {
    this.isActive = false;
    for (const b of this.butterflies) {
      if (b.state === 'ACTIVE' || b.state === 'SPAWNING') {
        b.dissolve();
      }
    }
  }

  /**
   * Toggles holographic shader vs biological solid appearance (for visual validation test)
   */
  setHolographicIntensity(intensity: number) {
    for (const b of this.butterflies) {
      b.setHolographicIntensity(intensity);
    }
  }

  /**
   * Detaches all butterflies from flowers and returns them to normal flight
   */
  detachFromFlowers() {
    for (const b of this.butterflies) {
      if (b.targetFlower || b.reservedSlot || b.flightMode.startsWith('FEED')) {
        b.releaseFlower();
        b.flightMode = 'NORMAL';
        b.proboscisExtension = 0;
      }
    }
  }

  /**
   * Main per-frame swarm simulation
   */
  update(dt: number, state: SharedInteractionState, flowerManager?: FlowerManager) {
    if (!this.isActive) {
      let anyAlive = false;
      for (const b of this.butterflies) {
        if (b.state !== 'DEAD' && b.meshes.rootGroup.visible) {
          b.update(dt, this.totalTime);
          anyAlive = true;
        }
      }
      if (!anyAlive) return;
    }

    this.totalTime += dt;
    const activeButterflies = this.butterflies.filter(
      (b) => b.state !== 'DEAD' && b.meshes.rootGroup.visible
    );
    if (activeButterflies.length === 0) return;

    // ── 1. Hand Motion & Velocity Detection ──
    const handDetected = state.handDetected || state.isDemoMode;
    const handPos = state.worldFingertip;
    const currentGesture = state.gesture;

    if (handDetected) {
      this.vHand.set(handPos.x, handPos.y, handPos.z);
      this.handVelocity.subVectors(this.vHand, this.prevHandPos).divideScalar(Math.max(0.001, dt));
      this.prevHandPos.copy(this.vHand);

      const handSpeed = this.handVelocity.length();

      // Sudden fast hand wave: panic scatter away!
      if (handSpeed > 3.8 && !this.isHandScattering) {
        this.isHandScattering = true;
        this.handScatterTimer = 1.8;
      }
    } else {
      this.vHand.set(0, 0, 0);
      this.handVelocity.set(0, 0, 0);
    }

    if (this.handScatterTimer > 0) {
      this.handScatterTimer -= dt;
      if (this.handScatterTimer <= 0) {
        this.isHandScattering = false;
      }
    }

    // ── 2. Butterfly Flight & Flower Ecosystem Interaction ──
    const count = activeButterflies.length;

    for (let i = 0; i < count; i++) {
      const b1 = activeButterflies[i];
      if (b1.state !== 'ACTIVE') {
        b1.update(dt, this.totalTime);
        continue;
      }

      const isFlowersActive = Boolean(flowerManager && flowerManager.isEnabled());

      // If flower system is disabled, immediately release any lingering flower connection
      if (!isFlowersActive && (b1.targetFlower !== null || b1.flightMode.startsWith('FEED'))) {
        b1.releaseFlower();
        b1.flightMode = 'NORMAL';
        b1.proboscisExtension = 0;
      }

      // Check if butterfly is actively interacting with a flower
      const isFlowerInteracting =
        isFlowersActive &&
        (b1.flightMode === 'FEED_APPROACH' ||
          b1.flightMode === 'FEED_HOVER' ||
          b1.flightMode === 'FEEDING');

      // ── Flower Scent Detection & Autonomous Decision (strictly gated when enabled) ──
      if (isFlowersActive && !isFlowerInteracting && flowerManager && b1.flightMode === 'NORMAL' && b1.targetFlower === null) {
        // Diverse personality: butterflies with high interest actively seek flowers
        if (b1.flowerInterest > 0.35 && Math.random() < 0.25) {
          const flowerQuery = flowerManager.findFlowerForButterfly(b1.position, 6.5);
          if (flowerQuery) {
            const slot = flowerQuery.flower.reserveSlot(b1.id);
            if (slot) {
              b1.targetFlower = flowerQuery.flower;
              b1.reservedSlot = slot;
              b1.flightMode = 'FEED_APPROACH';
            }
          }
        }
      }

      // Skip generic flocking/scattering forces if currently feeding on a petal
      if (!isFlowerInteracting) {
        this.vSeparation.set(0, 0, 0);
        this.vAlignment.set(0, 0, 0);
        let neighbors = 0;

        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const b2 = activeButterflies[j];
          if (b2.state !== 'ACTIVE') continue;

          const dist = b1.position.distanceTo(b2.position);

          // Generous personal space bubble (r < 1.8m)
          if (dist > 0.001 && dist < 1.8) {
            this.vTemp.subVectors(b1.position, b2.position).normalize().divideScalar(Math.max(0.15, dist));
            this.vSeparation.add(this.vTemp);
          }

          if (dist < 2.5) {
            this.vAlignment.add(b2.velocity);
            neighbors++;
          }
        }

        if (neighbors > 0) {
          this.vAlignment.divideScalar(neighbors).normalize().multiplyScalar(b1.maxSpeed * 0.6);
          this.vAlignment.sub(b1.velocity).clampLength(0, b1.maxForce * 0.4);
        }

        // Unique per-butterfly 3D independent wander trajectory
        const t = this.totalTime * (0.7 + (b1.id % 4) * 0.18) + b1.id * 1.8;
        this.vWander.set(
          Math.sin(t * 0.7) * 1.6 + Math.cos(t * 1.3) * 0.6,
          Math.cos(t * 0.9) * 0.8 + Math.sin(t * 0.4) * 0.4,
          Math.cos(t * 0.6) * 1.4 + Math.sin(t * 1.1) * 0.5
        ).multiplyScalar(1.2);

        // Apply forces
        b1.applyForce(this.vSeparation.multiplyScalar(4.0));
        b1.applyForce(this.vAlignment);
        b1.applyForce(this.vWander);

        // ── 3. Dedicated Gesture Commands ──
        if (handDetected) {
          const toHand = this.vTemp.subVectors(this.vHand, b1.position);
          const distToHand = toHand.length();

          if (this.isHandScattering) {
            // Panic scatter away from sudden hand motion
            if (distToHand < 5.0) {
              toHand.normalize().multiplyScalar(-6.5);
              b1.applyForce(toHand);
              b1.flightMode = 'FAST';
            }
          } else if (currentGesture === 'CROSSED_FINGERS') {
            // ── 🤞 CROSSED_FINGERS: SWARM SUMMON & GENTLE PERCH ──
            b1.flightMode = 'HOVER';
            const slotX = ((b1.id % 6) - 2.5) * 0.18;
            const slotY = 0.08 + Math.floor(b1.id / 6) * 0.09;
            const slotZ = (b1.id % 2 === 0 ? 0.07 : -0.07);
            const perchTarget = new THREE.Vector3(
              this.vHand.x + slotX,
              this.vHand.y + slotY,
              this.vHand.z + slotZ
            );
            b1.seek(perchTarget, 3.8, 0.12);
          } else if (currentGesture === 'SHAKA') {
            // ── 🤙 SHAKA: WIDE CELESTIAL DANCE ──
            const danceAngle = this.totalTime * 1.6 + (b1.id / count) * Math.PI * 2;
            const danceR = 1.6 + (b1.id % 4) * 0.45;
            const danceTarget = new THREE.Vector3(
              this.vHand.x + Math.cos(danceAngle) * danceR,
              this.vHand.y + Math.sin(danceAngle * 1.3) * 0.5 + (b1.id % 3 - 1) * 0.4,
              this.vHand.z + Math.sin(danceAngle) * danceR
            );
            b1.seek(danceTarget, 2.2, 0.4);
          } else if (currentGesture === 'LOVE_SIGN') {
            // ── 🤟 LOVE_SIGN: LEAD PERCH & HALO ──
            if (b1.id < 3) {
              b1.flightMode = 'HOVER';
              const perchOffset = new THREE.Vector3(
                (b1.id - 1) * 0.16,
                0.14,
                (b1.id % 2 === 0 ? 0.07 : -0.07)
              );
              b1.seek(this.vHand.clone().add(perchOffset), 3.5, 0.15);
            } else {
              const haloAngle = this.totalTime * 1.0 + (b1.id / count) * Math.PI * 2;
              const haloR = 1.3 + (b1.id % 3) * 0.35;
              const haloTarget = new THREE.Vector3(
                this.vHand.x + Math.cos(haloAngle) * haloR,
                this.vHand.y + 0.3 + Math.sin(haloAngle * 1.8) * 0.25,
                this.vHand.z + Math.sin(haloAngle) * haloR
              );
              b1.seek(haloTarget, 1.8, 0.4);
            }
          } else {
            // Normal Ambient Hand Presence: gently veer around hand
            if (distToHand < 1.2) {
              toHand.normalize().multiplyScalar(-2.2);
              b1.applyForce(toHand);
            }
          }
        }

        // Soft bounding box so butterflies roam freely across the full 3D view
        const maxBoundsX = 4.8;
        const maxBoundsY = 2.8;
        const maxBoundsZ = 3.2;

        if (Math.abs(b1.position.x) > maxBoundsX) {
          b1.applyForce(new THREE.Vector3(-Math.sign(b1.position.x) * 2.5, 0, 0));
        }
        if (Math.abs(b1.position.y) > maxBoundsY) {
          b1.applyForce(new THREE.Vector3(0, -Math.sign(b1.position.y) * 2.5, 0));
        }
        if (Math.abs(b1.position.z) > maxBoundsZ) {
          b1.applyForce(new THREE.Vector3(0, 0, -Math.sign(b1.position.z) * 2.5));
        }
      }

      b1.update(dt, this.totalTime);
    }
  }

  /**
   * Cleans up all butterfly resources
   */
  dispose() {
    for (const b of this.butterflies) {
      b.dispose();
    }
    this.butterflies = [];
  }
}
