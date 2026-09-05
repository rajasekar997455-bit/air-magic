import * as THREE from 'three';
import {
  createButterflyModel,
  type ButterflyMeshes,
} from './ButterflyAnatomy';
import {
  createButterflyMaterials,
  type ButterflyMaterials,
} from './ButterflyMaterial';
import type { HolographicFlower } from '../flowers/HolographicFlower';
import type { PerchSlot } from '../flowers/FlowerAnatomy';

export type ButterflyFlightMode =
  | 'NORMAL'
  | 'GLIDE'
  | 'FAST'
  | 'HOVER'
  | 'FEED_APPROACH'
  | 'FEED_HOVER'
  | 'FEEDING'
  | 'FEED_TAKEOFF';

export type ButterflyState = 'SPAWNING' | 'ACTIVE' | 'DISSOLVING' | 'DEAD';

/**
 * Biological 3D Butterfly Instance
 * 
 * Implements authentic lepidopteran flight mechanics:
 * - Asymmetric wingbeat (fast power stroke, slower recovery stroke)
 * - Independent forewing and hindwing kinematics with aerodynamic phase lag
 * - Dynamic wing pronation/supination (pitch twisting during strokes)
 * - Reaction-force body bobbing and abdominal undulation
 * - Aerodynamic banking into lateral turns
 * - Periodic gliding with dihedral V wing positioning
 * - Holographic flower approach, alignment, proboscis feeding & nectar energy absorption
 */
export class Butterfly {
  public meshes: ButterflyMeshes;
  public materials: ButterflyMaterials;

  // Transform & Physics Vectors (Reused to prevent garbage collection)
  public position = new THREE.Vector3();
  public velocity = new THREE.Vector3();
  public acceleration = new THREE.Vector3();
  public target = new THREE.Vector3();

  private forward = new THREE.Vector3(0, 0, 1);
  private tempVec = new THREE.Vector3();
  private tempQuat = new THREE.Quaternion();
  private tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private rotMatrix = new THREE.Matrix4();

  // Individual Biological Characteristics
  public id: number;
  public scale: number;
  public baseFrequency: number;     // 7.5 - 11.5 Hz natural wingbeat
  public phaseOffset: number;       // unique timing offset (never synchronized)
  public glideProbability: number;  // frequency of gliding behavior
  public maxSpeed: number;
  public maxForce: number;

  // Autonomous Flower & Ecosystem Behavior
  public flowerInterest: number;    // 0.0 (ignores flowers) to 1.0 (loves flowers)
  public targetFlower: HolographicFlower | null = null;
  public reservedSlot: PerchSlot | null = null;
  public feedTimer = 0;
  public feedDuration = 4.5;        // 3.5 - 6.0s drinking time
  public proboscisExtension = 0.0;  // 0 (coiled) to 1 (extended into nectar)
  public originalVeinColor: THREE.Color;
  public nectarEnergyTransfer = 0.0;

  // Kinematic State
  public flightMode: ButterflyFlightMode = 'NORMAL';
  public state: ButterflyState = 'SPAWNING';
  private modeTimer = 0;
  private flapTime = 0;
  private spawnTime = 0;
  private spawnDuration = 1.2;      // 0.8 - 1.5s materialization
  private dissolveTime = 0;
  private dissolveDuration = 1.0;
  private bankAngle = 0;
  private pitchAngle = 0;

  constructor(id: number, scene: THREE.Scene, colorIndex: number = 0) {
    this.id = id;
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.scale = 0.75 + Math.random() * 0.45; // Natural size variation
    this.baseFrequency = 8.0 + Math.random() * 3.5; // 8 - 11.5 Hz
    this.glideProbability = 0.10 + Math.random() * 0.20;
    this.maxSpeed = 2.4 + Math.random() * 1.2;
    this.maxForce = 3.5 + Math.random() * 1.5;

    // Autonomous personality trait: some butterflies love flowers, some ignore
    this.flowerInterest = ((id * 37 + 19) % 100) / 100;
    this.feedDuration = 3.5 + Math.random() * 2.5;

    // Create materials and anatomical model
    this.materials = createButterflyMaterials(colorIndex, this.phaseOffset);
    this.originalVeinColor = this.materials.uniforms.uVeinColor.value.clone();

    this.meshes = createButterflyModel(
      this.materials.bodyMaterial,
      this.materials.forewingMaterial,
      this.materials.hindwingMaterial
    );

    this.meshes.rootGroup.scale.setScalar(this.scale);
    this.meshes.rootGroup.visible = false;
    scene.add(this.meshes.rootGroup);
  }

  /**
   * Spawns the butterfly at a given 3D coordinate
   */
  spawn(origin: THREE.Vector3) {
    this.position.copy(origin);
    this.velocity.set(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 1.5
    );
    this.acceleration.set(0, 0, 0);
    this.meshes.rootGroup.position.copy(this.position);
    this.meshes.rootGroup.visible = true;
    this.state = 'SPAWNING';
    this.spawnTime = 0;
    this.flightMode = 'NORMAL';
    this.modeTimer = 0;
    this.flapTime = this.phaseOffset;
    this.materials.uniforms.uProgress.value = 0.0;
    this.proboscisExtension = 0.0;
    this.targetFlower = null;
    this.reservedSlot = null;
  }

  /**
   * Starts smooth dissolve wave
   */
  dissolve() {
    if (this.state === 'DEAD' || this.state === 'DISSOLVING') return;
    this.releaseFlower();
    this.state = 'DISSOLVING';
    this.dissolveTime = 0;
  }

  /**
   * Releases any flower perch slot currently occupied
   */
  releaseFlower() {
    if (this.targetFlower && this.reservedSlot !== null) {
      this.targetFlower.releaseSlot(this.reservedSlot.slotIndex);
      this.targetFlower = null;
      this.reservedSlot = null;
    }
  }

  /**
   * Toggles holographic shader vs biological solid appearance
   */
  setHolographicIntensity(intensity: number) {
    this.materials.uniforms.uHoloIntensity.value = intensity;
  }

  /**
   * Applies an external steering force
   */
  applyForce(force: THREE.Vector3) {
    this.acceleration.add(force);
  }

  /**
   * Seeks toward a target point with deceleration arrival
   */
  seek(target: THREE.Vector3, weight: number = 1.0, slowingRadius: number = 0.8) {
    this.tempVec.subVectors(target, this.position);
    const dist = this.tempVec.length();
    if (dist < 0.001) return;

    let desiredSpeed = this.maxSpeed;
    if (dist < slowingRadius) {
      desiredSpeed = this.maxSpeed * (dist / slowingRadius);
    }

    this.tempVec.normalize().multiplyScalar(desiredSpeed);
    const steer = this.tempVec.sub(this.velocity);
    steer.clampLength(0, this.maxForce);
    this.applyForce(steer.multiplyScalar(weight));
  }

  /**
   * Main per-frame physics, flight kinematics, and flower feeding solver
   */
  update(dt: number, totalTime: number) {
    if (this.state === 'DEAD') return;

    // ── 1. Spawn / Dissolve Materialization Waves ──
    if (this.state === 'SPAWNING') {
      this.spawnTime += dt;
      const progress = Math.min(1.0, this.spawnTime / this.spawnDuration);
      this.materials.uniforms.uProgress.value = progress;
      if (progress >= 1.0) {
        this.state = 'ACTIVE';
      }
    } else if (this.state === 'DISSOLVING') {
      this.dissolveTime += dt;
      const progress = Math.max(0.0, 1.0 - this.dissolveTime / this.dissolveDuration);
      this.materials.uniforms.uProgress.value = progress;
      if (progress <= 0.0) {
        this.state = 'DEAD';
        this.meshes.rootGroup.visible = false;
        return;
      }
    }

    this.modeTimer += dt;

    // ── 2. Autonomous Flight Mode Decision Machine ──
    if (this.flightMode === 'NORMAL') {
      if (this.modeTimer > 2.5 + Math.random() * 3.0) {
        const r = Math.random();
        if (r < this.glideProbability && this.velocity.y < 0.2) {
          this.flightMode = 'GLIDE';
        } else if (r < 0.35) {
          this.flightMode = 'FAST';
        }
        this.modeTimer = 0;
      }
    } else if (this.flightMode === 'FAST') {
      if (this.modeTimer > 1.2) {
        this.flightMode = 'NORMAL';
        this.modeTimer = 0;
      }
    } else if (this.flightMode === 'GLIDE') {
      if (this.modeTimer > 1.4 + Math.random() * 1.5) {
        this.flightMode = 'NORMAL';
        this.modeTimer = 0;
      }
    }

    // ── 3. Holographic Flower Feeding State Machine ──
    if (this.flightMode === 'FEED_APPROACH' && this.reservedSlot) {
      // Approach target petal slot from slightly above
      const approachTarget = this.reservedSlot.worldPosition.clone().add(new THREE.Vector3(0, 0.18, 0));
      this.seek(approachTarget, 2.5, 0.6);
      this.proboscisExtension = THREE.MathUtils.lerp(this.proboscisExtension, 0.45, 4.0 * dt);

      const d = this.position.distanceTo(this.reservedSlot.worldPosition);
      if (d < 0.25) {
        this.flightMode = 'FEED_HOVER';
        this.modeTimer = 0;
      }
    } else if (this.flightMode === 'FEED_HOVER' && this.reservedSlot) {
      // Hover and align body with the petal normal & tangent
      this.seek(this.reservedSlot.worldPosition, 3.5, 0.15);
      this.proboscisExtension = THREE.MathUtils.lerp(this.proboscisExtension, 0.75, 4.0 * dt);

      const d = this.position.distanceTo(this.reservedSlot.worldPosition);
      if (d < 0.06 || this.modeTimer > 1.2) {
        // Contact! Legs touch petal surface, start feeding
        this.flightMode = 'FEEDING';
        this.feedTimer = 0;
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
      }
    } else if (this.flightMode === 'FEEDING' && this.reservedSlot && this.targetFlower) {
      // Anchored to petal surface
      this.position.copy(this.reservedSlot.worldPosition);
      this.velocity.set(0, 0, 0);
      this.feedTimer += dt;

      // Proboscis extends into the central nectar pool
      this.proboscisExtension = THREE.MathUtils.lerp(this.proboscisExtension, 1.0, 5.0 * dt);

      // Nectar energy absorption wave: wing veins absorb the flower's glowing hue
      this.nectarEnergyTransfer = Math.min(1.0, this.nectarEnergyTransfer + dt * 0.45);
      this.materials.uniforms.uVeinColor.value.lerpColors(
        this.originalVeinColor,
        this.targetFlower.theme.nectarColor,
        this.nectarEnergyTransfer * 0.45
      );

      // Finish feeding if duration elapsed or flower depleted
      if (this.feedTimer >= this.feedDuration || this.targetFlower.state === 'DEPLETED') {
        this.flightMode = 'FEED_TAKEOFF';
        this.modeTimer = 0;
        this.releaseFlower();
      }
    } else if (this.flightMode === 'FEED_TAKEOFF') {
      // Proboscis retracts, wings accelerate, lifts off into spiral climb
      this.proboscisExtension = THREE.MathUtils.lerp(this.proboscisExtension, 0.0, 8.0 * dt);
      this.velocity.set(
        Math.cos(this.modeTimer * 4.0) * 1.5,
        2.2, // Strong upward lift
        Math.sin(this.modeTimer * 4.0) * 1.5
      );

      if (this.modeTimer > 0.9) {
        this.flightMode = 'NORMAL';
        this.modeTimer = 0;
      }
    }

    // Nectar glow gradual decay back to natural after takeoff
    if (this.flightMode !== 'FEEDING' && this.nectarEnergyTransfer > 0) {
      this.nectarEnergyTransfer = Math.max(0.0, this.nectarEnergyTransfer - dt * 0.08);
      if (this.targetFlower) {
        this.materials.uniforms.uVeinColor.value.lerpColors(
          this.originalVeinColor,
          this.targetFlower.theme.nectarColor,
          this.nectarEnergyTransfer * 0.45
        );
      } else {
        this.materials.uniforms.uVeinColor.value.copy(this.originalVeinColor);
      }
    }

    // ── 4. Smooth Flight Physics Integration ──
    const isFeeding = this.flightMode === 'FEEDING';
    if (!isFeeding) {
      if (this.flightMode === 'GLIDE') {
        this.acceleration.y -= 0.5 * dt;
      }

      this.velocity.addScaledVector(this.acceleration, dt);
      const currentSpeed = this.velocity.length();
      const speedLimit = this.flightMode === 'FAST' ? this.maxSpeed * 1.5 : this.maxSpeed;
      if (currentSpeed > speedLimit) {
        this.velocity.multiplyScalar(speedLimit / currentSpeed);
      }

      this.velocity.multiplyScalar(Math.pow(0.97, dt * 60));
      this.position.addScaledVector(this.velocity, dt);
      this.acceleration.set(0, 0, 0);

      // ── 5. 3D Body Orientation & Aerodynamic Banking ──
      if (currentSpeed > 0.05) {
        this.forward.copy(this.velocity).normalize();
        const desiredPitch = Math.asin(THREE.MathUtils.clamp(this.forward.y, -0.85, 0.85));
        this.pitchAngle += (desiredPitch - this.pitchAngle) * 6.0 * dt;

        const lateralTurn = this.velocity.x * this.forward.z - this.velocity.z * this.forward.x;
        const desiredBank = THREE.MathUtils.clamp(-lateralTurn * 2.2, -0.65, 0.65);
        this.bankAngle += (desiredBank - this.bankAngle) * 8.0 * dt;

        const yaw = Math.atan2(this.forward.x, this.forward.z);
        this.tempEuler.set(-this.pitchAngle, yaw, -this.bankAngle, 'YXZ');
        this.tempQuat.setFromEuler(this.tempEuler);
        this.meshes.rootGroup.quaternion.slerp(this.tempQuat, Math.min(1.0, 10.0 * dt));
      }
    } else if (this.reservedSlot) {
      // While perched on petal, align directly with petal surface normal & tangent
      const up = this.reservedSlot.surfaceNormal;
      const forward = this.reservedSlot.headingTangent;
      const right = this.tempVec.crossVectors(up, forward).normalize();
      const trueForward = this.tempVec.clone().crossVectors(right, up).normalize();

      this.rotMatrix.makeBasis(right, up, trueForward);
      this.tempQuat.setFromRotationMatrix(this.rotMatrix);
      this.meshes.rootGroup.quaternion.slerp(this.tempQuat, Math.min(1.0, 12.0 * dt));
    }

    // ── 6. Proboscis Visual Extension / Coiling ──
    const pScale = THREE.MathUtils.lerp(0.35, 1.2, this.proboscisExtension);
    this.meshes.proboscisGroup.scale.set(pScale, pScale, pScale);
    // Uncurls forward and downward when feeding
    this.meshes.proboscisGroup.rotation.x = THREE.MathUtils.lerp(-0.6, 0.25, this.proboscisExtension);

    // ── 7. Biological Flap Kinematics ──
    let freq = this.baseFrequency;
    let strokeAmplitude = 0.85;

    if (isFeeding) {
      // Gentle, peaceful resting flutter while drinking
      freq = 0.55;
      strokeAmplitude = 0.22;
    } else if (this.flightMode === 'FEED_TAKEOFF' || this.flightMode === 'FAST') {
      freq *= 1.4;
      strokeAmplitude = 1.05;
    } else if (this.flightMode === 'HOVER' || this.flightMode === 'FEED_HOVER') {
      freq *= 0.7;
      strokeAmplitude = 0.65;
    } else if (this.flightMode === 'GLIDE') {
      freq *= 0.15;
      strokeAmplitude = 0.12;
    }

    this.flapTime += dt * freq;
    const cycle = this.flapTime % (Math.PI * 2);

    let flapNorm: number;
    if (this.flightMode === 'GLIDE' || isFeeding) {
      flapNorm = 0.35 + Math.sin(this.flapTime * 2.0) * 0.06;
    } else {
      const s = Math.sin(cycle);
      const harmonic = Math.sin(cycle * 2.0 - Math.PI * 0.5) * 0.22;
      flapNorm = s + harmonic;
    }

    const forewingAngle = flapNorm * strokeAmplitude;
    const hindwingCycle = (this.flapTime - 0.28) % (Math.PI * 2);
    const hindwingNorm = Math.sin(hindwingCycle) + Math.sin(hindwingCycle * 2.0 - Math.PI * 0.5) * 0.22;
    const hindwingAngle = hindwingNorm * strokeAmplitude * 0.88;

    const pronation = Math.cos(cycle) * 0.20;

    // Apply wing hinge rotations
    this.meshes.leftForewingGroup.rotation.z = -forewingAngle;
    this.meshes.leftForewingGroup.rotation.x = pronation;
    this.meshes.leftHindwingGroup.rotation.z = -hindwingAngle;
    this.meshes.leftHindwingGroup.rotation.x = pronation * 0.7;

    this.meshes.rightForewingGroup.rotation.z = forewingAngle;
    this.meshes.rightForewingGroup.rotation.x = pronation;
    this.meshes.rightHindwingGroup.rotation.z = hindwingAngle;
    this.meshes.rightHindwingGroup.rotation.x = pronation * 0.7;

    // Subtle body bobbing & abdominal oscillation (keeps butterfly alive while feeding)
    const downstrokePower = Math.max(0.0, -Math.cos(cycle));
    const bobOffset = isFeeding ? Math.sin(this.flapTime * 3.0) * 0.008 : downstrokePower * 0.05;
    this.meshes.bodyGroup.position.y = bobOffset;

    const abdomenFlex = -0.15 - (isFeeding ? Math.sin(this.flapTime * 2.0) * 0.04 : downstrokePower * 0.10);
    this.meshes.abdomenMesh.rotation.x = abdomenFlex;

    // Antenna sway
    const sway = Math.sin(this.flapTime * 1.5) * (isFeeding ? 0.02 : 0.05);
    this.meshes.leftAntenna.rotation.z = sway;
    this.meshes.rightAntenna.rotation.z = -sway;

    // Position & shader uniforms
    this.meshes.rootGroup.position.copy(this.position);
    this.materials.uniforms.uTime.value = totalTime;
    this.materials.uniforms.uFlapFlex.value = Math.abs(flapNorm);
  }

  /**
   * Cleans up resources
   */
  dispose() {
    this.releaseFlower();
    this.state = 'DEAD';
  }
}
