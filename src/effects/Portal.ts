import * as THREE from 'three';
import { ParticleSystem } from '../graphics/ParticleSystem';
import type { PortalType } from '../types';
import type { PortalRenderer } from './portals/PortalTypes';
import { GalaxyPortal } from './portals/GalaxyPortal';
import { CyberPortal } from './portals/CyberPortal';
import { GoldenPortal } from './portals/GoldenPortal';
import { IcePortal } from './portals/IcePortal';
import { VoidPortal } from './portals/VoidPortal';
import { LavaPortal } from './portals/LavaPortal';
import { NaturePortal } from './portals/NaturePortal';
import { NeonPortal } from './portals/NeonPortal';
import { SymbolOfLovePortal } from './portals/SymbolOfLovePortal';

// Re-export curves for backward compatibility
export * from './portals/PortalCurves';
export * from './portals/PortalTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// Master PortalEffect Architecture
// ═══════════════════════════════════════════════════════════════════════════════

export class PortalEffect {
  public group: THREE.Group;
  public isActive = false;

  private age = 0;
  private readonly maxAge = 9.0;
  private currentType: PortalType = 'NEON';
  private targetScale = 1.0;
  private currentScale = 0.01;

  // Cached portal renderers for instantaneous zero-latency switching
  private renderers: Partial<Record<PortalType, PortalRenderer>> = {};
  private activeRenderer: PortalRenderer | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    // Lazily instantiate starting renderer
    this.switchPortalType('NEON');
  }

  private getOrCreateRenderer(type: PortalType): PortalRenderer {
    if (this.renderers[type]) {
      return this.renderers[type]!;
    }

    let renderer: PortalRenderer;
    switch (type) {
      case 'GALAXY':
        renderer = new GalaxyPortal();
        break;
      case 'CYBER':
        renderer = new CyberPortal();
        break;
      case 'GOLDEN':
        renderer = new GoldenPortal();
        break;
      case 'ICE':
        renderer = new IcePortal();
        break;
      case 'VOID':
        renderer = new VoidPortal();
        break;
      case 'LAVA':
        renderer = new LavaPortal();
        break;
      case 'NATURE':
        renderer = new NaturePortal();
        break;
      case 'NEON':
        renderer = new NeonPortal();
        break;
      case 'SYMBOL_OF_LOVE':
        renderer = new SymbolOfLovePortal();
        break;
      default:
        renderer = new VoidPortal();
        break;
    }

    this.renderers[type] = renderer;
    return renderer;
  }

  private switchPortalType(type: PortalType) {
    if (this.activeRenderer) {
      this.group.remove(this.activeRenderer.group);
    }

    const nextRenderer = this.getOrCreateRenderer(type);
    this.activeRenderer = nextRenderer;
    this.currentType = type;
    this.group.add(nextRenderer.group);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  activate(pos: { x: number; y: number; z: number }, type: PortalType = 'NEON', scale = 1.0) {
    if (type !== this.currentType || !this.activeRenderer) {
      this.switchPortalType(type);
    }

    this.isActive = true;
    this.age = 0;
    this.targetScale = scale;
    this.currentScale = 0.01;

    this.group.position.set(pos.x, pos.y, pos.z);
    this.group.visible = true;
    this.group.scale.set(0.01, 0.01, 0.01);

    if (this.activeRenderer) {
      this.activeRenderer.activate(scale);
    }
  }

  setScale(scale: number) {
    this.targetScale = Math.max(0.3, Math.min(3.0, scale));
  }

  update(
    dt: number,
    particleSystem: ParticleSystem,
    handPos: { x: number; y: number; z: number },
    handDetected: boolean
  ) {
    if (!this.isActive || !this.activeRenderer) return;

    this.age += dt;
    if (this.age >= this.maxAge) {
      this.deactivate();
      return;
    }

    // Smoothly follow hand position in 3D world space
    if (handDetected) {
      this.group.position.x += (handPos.x - this.group.position.x) * 3.5 * dt;
      this.group.position.y += (handPos.y - this.group.position.y) * 3.5 * dt;
    }

    // Smooth scale interpolation (supports dual-hand scaling 0.4x - 2.5x)
    this.currentScale += (this.targetScale - this.currentScale) * 8.0 * dt;

    // Entrance + fade-out envelope
    const fadeIn = Math.min(1.0, this.age / 0.5);
    const fadeOut = Math.max(0.0, (this.maxAge - this.age) / 1.2);
    const envScale = fadeIn * Math.min(1.0, fadeOut);
    const finalScale = this.currentScale * envScale;

    this.group.scale.set(finalScale, finalScale, finalScale);

    // Delegate rendering, procedural motion, and particle physics to portal-specific renderer
    this.activeRenderer.update(
      dt,
      this.age,
      this.maxAge,
      envScale,
      this.currentScale,
      particleSystem,
      this.group.position
    );
  }

  deactivate() {
    this.isActive = false;
    this.group.visible = false;
  }

  get active() {
    return this.isActive;
  }

  dispose() {
    for (const key of Object.keys(this.renderers)) {
      const r = this.renderers[key as PortalType];
      if (r) {
        r.dispose();
      }
    }
    this.renderers = {};
    this.activeRenderer = null;
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
