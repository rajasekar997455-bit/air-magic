import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { PortalEffect } from '../effects/Portal';
import { LightningEffect } from '../effects/Lightning';
import { JarvisHUD } from '../effects/JarvisHUD';
import { TextParticleGenerator } from '../effects/TextParticles';
import { ButterflySwarm } from '../creatures/butterflies/ButterflySwarm';
import { FlowerManager } from '../creatures/flowers/FlowerManager';
import { SmileEffect } from '../effects/SmileEffect';
import type { SharedInteractionState, PortalType } from '../types';

export class EffectsManager {
  private particleSystem: ParticleSystem;
  private portal: PortalEffect;
  private portal2: PortalEffect; // Second portal for wormhole
  private lightning: LightningEffect;
  private jarvisHud: JarvisHUD;
  private textGen: TextParticleGenerator;
  private butterflySwarm: ButterflySwarm;
  private flowerManager: FlowerManager;
  private smileEffect: SmileEffect;

  // Wormhole state
  private wormholeActive = false;
  private wormholeAge = 0;
  private wormholeDuration = 12.0;

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
    this.portal = new PortalEffect(scene);
    this.portal2 = new PortalEffect(scene);
    this.lightning = new LightningEffect(scene);
    this.jarvisHud = new JarvisHUD(scene);
    this.textGen = new TextParticleGenerator();
    this.butterflySwarm = new ButterflySwarm(scene);
    this.flowerManager = new FlowerManager(scene);
    this.smileEffect = new SmileEffect(scene);
  }

  triggerSpell(word: string, state: SharedInteractionState) {
    const handPos = state.worldFingertip;

    switch (word.toUpperCase()) {
      case 'SMILE':
        this.triggerSmile(handPos);
        break;
      case 'HELLO':
        this.triggerHello(handPos);
        break;
      case 'MAGIC':
        this.triggerMagic(handPos, state);
        break;
      case 'FIRE':
        this.triggerFire(handPos);
        break;
      case 'STAR':
        this.triggerStar(handPos);
        break;
      case 'LOVE':
        this.triggerLove(handPos);
        break;
      case 'CHIEF':
        this.triggerChief(handPos);
        break;
      case 'JARVIS':
      case 'AI':
        this.triggerJarvis(handPos);
        break;
      case 'PORTAL':
        this.triggerPortal(handPos, state.portalType ?? 'NEON', state.portalScale ?? 1.0);
        break;
      case 'WORMHOLE':
        this.triggerWormhole(handPos);
        break;
      case 'BUTTERFLY':
      case 'BUTTERFLIES':
      case 'SWARM':
        this.triggerButterflies(handPos, state);
        break;
      default:
        // Generic cyan burst with golden rune glow
        this.particleSystem.emitBurst(
          handPos, 400,
          { r: 0.4, g: 0.9, b: 1.0 },
          8, 0.5, 20, 2.0
        );
        // Floating rune-style ring at hand position
        this.emitRuneRing(handPos);
        break;
    }
  }

  // Called from GraphicsEngine when PINCH held long enough (1.5s)
  triggerPushPortal(pos: { x: number; y: number; z: number }, type: PortalType = 'NEON') {
    this.portal.activate(pos, type, 1.2);
    // Color-matched burst for each portal type
    const colorMap: Record<PortalType, { r: number; g: number; b: number }> = {
      VOID: { r: 0.4, g: 0.1, b: 1.0 },
      GOLDEN: { r: 1.0, g: 0.6, b: 0.1 },
      GALAXY: { r: 0.7, g: 0.4, b: 1.0 },
      LAVA: { r: 1.0, g: 0.3, b: 0.0 },
      CYBER: { r: 0.1, g: 0.9, b: 1.0 },
      ICE: { r: 0.6, g: 0.88, b: 1.0 },
      NATURE: { r: 0.2, g: 0.9, b: 0.35 },
      NEON: { r: 1.0, g: 0.65, b: 0.15 },
      SYMBOL_OF_LOVE: { r: 1.0, g: 0.18, b: 0.55 },
    };
    const c = colorMap[type];
    this.particleSystem.emitBurst(pos, 80, c, 3.0, 0.3, 14, 0.8);
  }

  /** Returns true if the primary portal is currently visible/active. */
  isPortalActive(): boolean {
    return this.portal.active;
  }

  /** Immediately deactivate both portals and cancel the wormhole stream. */
  deactivatePortals(pos?: { x: number; y: number; z: number }) {
    if (this.portal.active && pos) {
      // Dispel burst when closing
      this.particleSystem.emitBurst(pos, 250, { r: 0.6, g: 0.8, b: 1.0 }, 6, 0.4, 16, 1.2);
    }
    this.portal.deactivate();
    this.portal2.deactivate();
    this.wormholeActive = false;
  }

  /** Spawns a realistic holographic butterfly swarm */
  triggerButterflies(pos?: { x: number; y: number; z: number }, state?: SharedInteractionState) {
    const origin = pos ?? { x: 0, y: 0, z: 0 };
    const tier = state?.tier ?? 'HIGH';
    this.butterflySwarm.spawn(origin, tier);
    if (state) state.butterfliesActive = true;
  }

  /** Dissolves the butterfly swarm */
  deactivateButterflies(state?: SharedInteractionState) {
    this.butterflySwarm.dissolve();
    if (state) state.butterfliesActive = false;
  }

  /** Toggles butterfly swarm */
  toggleButterflies(state?: SharedInteractionState) {
    if (this.butterflySwarm.isActive) {
      this.deactivateButterflies(state);
    } else {
      const pos = state ? state.worldFingertip : { x: 0, y: 0, z: 0 };
      this.triggerButterflies(pos, state);
    }
  }

  /** Returns true if butterflies are currently active */
  isButterfliesActive(): boolean {
    return this.butterflySwarm.isActive;
  }

  /** Sets holographic shader vs biological solid appearance (for visual realism test) */
  setButterflyHolographicIntensity(intensity: number) {
    this.butterflySwarm.setHolographicIntensity(intensity);
  }

  /** Returns true if Flower Mode is currently enabled */
  areFlowersEnabled(): boolean {
    return this.flowerManager.isEnabled();
  }

  /** Sets Flower Mode enabled/disabled with immediate full state reset and cleanup */
  setFlowersEnabled(enabled: boolean, state?: SharedInteractionState) {
    if (enabled) {
      this.flowerManager.enable();
      if (state) {
        state.flowersEnabled = true;
      }
    } else {
      this.flowerManager.disable();
      this.butterflySwarm.detachFromFlowers();
      if (state) {
        state.flowersEnabled = false;
        state.flowersActive = false;
        state.flowerCount = 0;
      }
    }
  }

  /** Toggles Flower Mode with complete dormancy when turned OFF */
  toggleFlowers(state?: SharedInteractionState): boolean {
    const next = !this.flowerManager.isEnabled();
    this.setFlowersEnabled(next, state);
    return next;
  }

  /** Spawns a holographic blooming flower (strictly conditional on flowersEnabled) */
  spawnFlower(pos?: { x: number; y: number; z: number }, state?: SharedInteractionState) {
    if (!this.flowerManager.isEnabled()) {
      return;
    }
    const origin = pos ? new THREE.Vector3(pos.x, pos.y, pos.z) : new THREE.Vector3(0, -0.2, 0);
    this.flowerManager.spawnFlower(origin);
    if (state) {
      state.flowersActive = true;
      state.flowerCount = this.flowerManager.getFlowerCount();
    }
  }

  /** Clears all active flowers */
  clearFlowers(state?: SharedInteractionState) {
    this.flowerManager.clearAll();
    this.butterflySwarm.detachFromFlowers();
    if (state) {
      state.flowersActive = false;
      state.flowerCount = 0;
    }
  }

  // Dual-hand portal scale control
  updatePortalScale(scale: number) {
    if (this.portal.active) {
      this.portal.setScale(scale);
    }
  }

  // Smile Spell — TWO_FINGERS held 2s, spell word, or button trigger
  triggerSmile(pos?: { x: number; y: number; z: number }, maxDuration: number = 6.0) {
    this.deactivatePortals();
    this.smileEffect.trigger(pos ?? { x: 0, y: 0, z: 0 }, this.particleSystem, maxDuration);
  }

  stopSmile() {
    this.smileEffect.stop(this.particleSystem);
  }

  isSmileActive(): boolean {
    return this.smileEffect.isActive;
  }

  // Backward compatibility alias for any existing caller
  triggerAurora(pos?: { x: number; y: number; z: number }) {
    this.triggerSmile(pos);
  }

  // Wormhole — two connected portals
  private triggerWormhole(pos: { x: number; y: number; z: number }) {
    const offset = 4.0;
    const pos1 = { x: pos.x - offset, y: pos.y, z: pos.z };
    const pos2 = { x: pos.x + offset, y: pos.y, z: pos.z };
    this.portal.activate(pos1, 'VOID', 1.0);
    this.portal2.activate(pos2, 'CYBER', 1.0);
    this.wormholeActive = true;
    this.wormholeAge = 0;
  }

  private emitRuneRing(pos: { x: number; y: number; z: number }) {
    // Emit particles in a circle that pulses outward — a "rune" glyph
    const count = 120;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.8;
      const px = pos.x + Math.cos(angle) * r;
      const py = pos.y + Math.sin(angle) * r;
      const vr = 0.5 + Math.random() * 0.5; // slight outward push
      const vx = Math.cos(angle) * vr;
      const vy = Math.sin(angle) * vr;
      this.particleSystem.emitParticle(
        px, py, pos.z,
        vx, vy, (Math.random() - 0.5) * 0.3,
        0.6, 0.2, 1.0, 16, 2.5, 0
      );
    }
  }

  private triggerHello(pos: { x: number; y: number; z: number }) {
    const targets = this.textGen.generateTargets('HELLO', { r: 0.2, g: 0.9, b: 1.0 }, 1400, 0.016);
    for (const t of targets) {
      this.particleSystem.emitParticle(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
        0, 0, 0, t.r, t.g, t.b, 18, 4.0, 0,
        { x: t.x + pos.x, y: t.y + pos.y, z: t.z + pos.z }
      );
    }
    setTimeout(() => {
      this.particleSystem.emitBurst(pos, 500, { r: 0.3, g: 1.0, b: 0.8 }, 12, 2.0, 24, 2.5);
    }, 1800);
  }

  private triggerMagic(pos: { x: number; y: number; z: number }, state: SharedInteractionState) {
    // MAGIC = Doctor Strange Sacred Geometry Sling Ring portal (NEON)
    const type = state.portalType ?? 'NEON';
    this.portal.activate(pos, type, state.portalScale ?? 1.0);
    this.particleSystem.emitBurst(pos, 100, { r: 1.0, g: 0.7, b: 0.2 }, 3.5, 0.3, 14, 0.8);
  }

  private triggerFire(pos: { x: number; y: number; z: number }) {
    // FIRE = LAVA portal + fire column
    this.portal.activate({ x: pos.x, y: pos.y - 1.5, z: pos.z }, 'LAVA', 0.9);
    for (let i = 0; i < 800; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.5;
      this.particleSystem.emitParticle(
        pos.x + Math.cos(angle) * r,
        pos.y - 1.5 + (Math.random() - 0.5) * 0.5,
        pos.z + Math.sin(angle) * r,
        (Math.random() - 0.5) * 1.5,
        2.0 + Math.random() * 4.0,
        (Math.random() - 0.5) * 1.5,
        1.0, 0.5, 0.1,
        20 + Math.random() * 10,
        2.0 + Math.random() * 1.0, 1
      );
    }
  }

  private triggerStar(pos: { x: number; y: number; z: number }) {
    // STAR = GALAXY portal + star particles
    this.portal.activate(pos, 'GALAXY', 1.1);
    for (let i = 0; i < 1000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 4 + Math.random() * 12;
      const isPurple = Math.random() > 0.5;
      this.particleSystem.emitParticle(
        pos.x, pos.y, pos.z,
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
        isPurple ? 0.8 : 0.2,
        isPurple ? 0.3 : 0.8,
        1.0,
        16 + Math.random() * 12,
        3.0 + Math.random() * 1.5, 2
      );
    }
  }

  private triggerLove(pos: { x: number; y: number; z: number }) {
    this.portal.activate(pos, 'SYMBOL_OF_LOVE', 1.25);
    const heartCount = 1200;
    for (let i = 0; i < heartCount; i++) {
      const t = (i / heartCount) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const z = (Math.random() - 0.5) * 4.0;
      const scale = 0.15;
      const target = { x: pos.x + x * scale, y: pos.y + y * scale, z: pos.z + z * scale };
      this.particleSystem.emitParticle(
        pos.x + (Math.random() - 0.5) * 10,
        pos.y + (Math.random() - 0.5) * 8,
        pos.z + (Math.random() - 0.5) * 4,
        0, 0, 0,
        1.0, 0.2 + Math.random() * 0.3, 0.6 + Math.random() * 0.4,
        20, 3.5, 0, target
      );
    }
  }

  private triggerChief(pos: { x: number; y: number; z: number }) {
    const targets = this.textGen.generateTargets('CHIEF', { r: 1.0, g: 0.8, b: 0.1 }, 1600, 0.017);
    for (const t of targets) {
      this.particleSystem.emitParticle(
        (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6,
        0, 0, 0, t.r, t.g, t.b, 22, 4.5, 0,
        { x: t.x + pos.x, y: t.y + pos.y, z: t.z + pos.z }
      );
    }
    setTimeout(() => {
      this.particleSystem.emitBurst(pos, 600, { r: 1.0, g: 0.9, b: 0.3 }, 14, 1.0, 28, 2.5);
    }, 2000);
  }

  private triggerJarvis(pos: { x: number; y: number; z: number }) {
    // JARVIS = CYBER portal + HUD + ONLINE text
    this.portal.activate(pos, 'CYBER', 1.0);
    this.jarvisHud.activate(pos);
    const targets = this.textGen.generateTargets('ONLINE', { r: 0.0, g: 0.9, b: 1.0 }, 800, 0.012);
    for (const t of targets) {
      this.particleSystem.emitParticle(
        pos.x + (Math.random() - 0.5) * 4,
        pos.y + (Math.random() - 0.5) * 4,
        pos.z, 0, 0, 0,
        t.r, t.g, t.b, 16, 4.0, 0,
        { x: t.x + pos.x, y: t.y + pos.y - 1.5, z: t.z + pos.z }
      );
    }
  }

  private triggerPortal(
    pos: { x: number; y: number; z: number },
    type: PortalType = 'NEON',
    scale = 1.0
  ) {
    this.portal.activate(pos, type, scale);
    // Quick burst ring matching portal color
    const colorMap: Record<PortalType, { r: number; g: number; b: number }> = {
      VOID: { r: 0.5, g: 0.1, b: 1.0 },
      GOLDEN: { r: 1.0, g: 0.6, b: 0.1 },
      GALAXY: { r: 0.7, g: 0.4, b: 1.0 },
      LAVA: { r: 1.0, g: 0.3, b: 0.0 },
      CYBER: { r: 0.1, g: 0.9, b: 1.0 },
      ICE: { r: 0.6, g: 0.88, b: 1.0 },
      NATURE: { r: 0.2, g: 0.9, b: 0.35 },
      NEON: { r: 1.0, g: 0.65, b: 0.15 },
      SYMBOL_OF_LOVE: { r: 1.0, g: 0.18, b: 0.55 },
    };
    this.particleSystem.emitBurst(pos, 80, colorMap[type], 3.0, 0.3, 14, 0.8);
  }

  triggerLightning(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number }
  ) {
    this.lightning.strike(start, end, this.particleSystem);
  }

  update(dt: number, state: SharedInteractionState) {
    state.portalActive = this.portal.active;

    // -- Portal 1 --
    this.portal.update(dt, this.particleSystem, state.worldFingertip, state.handDetected);

    // -- Portal 2 (wormhole partner) --
    if (this.portal2.active) {
      this.portal2.update(dt, this.particleSystem, state.secondHandFingertip || state.worldFingertip, state.secondHandDetected);
    }

    // -- Dual-hand portal scale control --
    // Any second hand gesture works — just bring your other hand in to resize
    if (state.secondHandDetected && this.portal.active) {
      // Map spread distance (0..12 world units) → scale (0.3..3.0)
      const normalizedSpread = Math.max(0, Math.min(12, state.handSpreadDistance));
      const targetScale = 0.3 + (normalizedSpread / 12) * 2.7;
      this.portal.setScale(targetScale);
    }

    // -- Wormhole particle stream --
    if (this.wormholeActive && this.portal.active && this.portal2.active) {
      this.wormholeAge += dt;
      if (this.wormholeAge > this.wormholeDuration) {
        this.wormholeActive = false;
      } else {
        // Stream particles between two portals
        const p1 = this.portal['group'].position as THREE.Vector3;
        const p2 = this.portal2['group'].position as THREE.Vector3;
        for (let i = 0; i < 6; i++) {
          const t = Math.random();
          const px = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 0.4;
          const py = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 0.4;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy) + 0.01;
          this.particleSystem.emitParticle(
            px, py, p1.z,
            (dx / len) * 8, (dy / len) * 8, (Math.random() - 0.5) * 1.5,
            0.3, 0.7, 1.0, 14, 0.6, 0
          );
        }
      }
    }

    // -- SMILE Effect (🙂 + glowing "SMILE" word) --
    this.smileEffect.update(dt, this.particleSystem, state.worldFingertip, state.handDetected);

    this.lightning.update(dt);
    this.jarvisHud.update(dt, state.worldFingertip, state.handDetected);

    // -- Flower Ecosystem Gating (dormant when OFF) --
    if (this.flowerManager.isEnabled()) {
      this.flowerManager.update(dt);
      state.flowersActive = this.flowerManager.getFlowerCount() > 0;
      state.flowerCount = this.flowerManager.getFlowerCount();
    } else {
      state.flowersActive = false;
      state.flowerCount = 0;
    }

    // Butterflies continue normal flight and hand interaction, flower logic enabled only when flowers are ON
    this.butterflySwarm.update(dt, state, this.flowerManager.isEnabled() ? this.flowerManager : undefined);
  }
}
