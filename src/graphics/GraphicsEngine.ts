import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { TrailSystem } from './TrailSystem';
import { EffectsManager } from './EffectsManager';
import { CoordinateMapper } from '../utils/Coordinates';
import type { SharedInteractionState } from '../types';

export class GraphicsEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public coordinateMapper: CoordinateMapper;

  public particleSystem: ParticleSystem;
  public trailSystem: TrailSystem;
  public effectsManager: EffectsManager;

  private container: HTMLElement;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;

  private state: SharedInteractionState;
  private lastProcessedWordTime = 0;

  // ── Gesture prev-frame trackers ──────────────────────────────────────────────
  private prevPinch = false;
  private prevTwoFingers = false;
  private prevThreeFingers = false;
  private prevFlowerBud = false;
  private prevOpenPalm = false;
  private prevFist = false;

  public onFrameRendered?: () => void;

  // ── Portal gesture ───────────────────────────────────────────────────────────
  /** Seconds of PINCH to OPEN or CYCLE a portal (fast 0.25s response) */
  private readonly PORTAL_OPEN_THRESHOLD = 0.25;
  /** Seconds of THREE_FINGERS to DISPEL/CLOSE an active portal */
  private readonly PORTAL_CLOSE_THRESHOLD = 0.5;
  private readonly PORTAL_TYPES: Array<import('../types').PortalType> = [
    'NEON',
    'SYMBOL_OF_LOVE',
    'GOLDEN',
    'VOID',
    'GALAXY',
    'LAVA',
    'CYBER',
    'ICE',
    'NATURE',
  ];

  // ── Aurora (TWO_FINGERS hold) ────────────────────────────────────────────────
  private readonly AURORA_HOLD_THRESHOLD = 2.0;

  constructor(container: HTMLElement, state: SharedInteractionState) {
    this.container = container;
    this.state = state;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);

    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    // Coordinate mapper
    this.coordinateMapper = new CoordinateMapper(this.camera, width, height);

    // Subsystems
    this.particleSystem = new ParticleSystem(this.scene, 30000);
    this.particleSystem.setPixelRatio(dpr);
    this.trailSystem = new TrailSystem(this.scene);
    this.effectsManager = new EffectsManager(this.scene, this.particleSystem);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
    this.particleSystem.setPixelRatio(dpr);
    this.coordinateMapper.updateDimensions(width, height);
  };

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  private animate = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    const renderStart = performance.now();

    // ── Spell recognition ────────────────────────────────────────────────────
    if (
      this.state.recognizedWord &&
      this.state.recognizedTimestamp > this.lastProcessedWordTime &&
      this.state.recognizedWord !== 'SPELL UNCLEAR'
    ) {
      this.lastProcessedWordTime = this.state.recognizedTimestamp;
      this.effectsManager.triggerSpell(this.state.recognizedWord, this.state);
    }

    // ── Real-time gesture reactions ──────────────────────────────────────────
    if (this.state.handDetected || this.state.isDemoMode || this.state.isDrawing) {
      const handPos = this.state.worldFingertip;
      const gesture = this.state.gesture;

      // 1. Drawing trail & fingertip sparks
      if (this.state.isDrawing) {
        this.trailSystem.addPoint(handPos, this.state.mode, true);
        this.particleSystem.emitFingertipStream(
          handPos,
          this.state.mode,
          this.state.tier === 'HIGH' ? 6 : this.state.tier === 'MEDIUM' ? 3 : 2
        );
      }

      // ── PINCH: plasma orb + lightning + portal open/cycle (NEVER closes) ──
      if (gesture === 'PINCH') {
        this.particleSystem.emitPinchOrb(
          handPos,
          this.state.tier === 'HIGH' ? 8 : 4
        );

        if (!this.prevPinch) {
          // Lightning strike on pinch start
          this.effectsManager.triggerLightning(
            { x: handPos.x + (Math.random() - 0.5) * 4, y: handPos.y + 3, z: 0 },
            handPos
          );
          this.state.portalHoldTime = 0;
        }

        this.state.portalHoldTime += dt;

        // Hold 0.25s → OPEN or CYCLE to next portal type
        if (this.state.portalHoldTime >= this.PORTAL_OPEN_THRESHOLD) {
          if (this.effectsManager.isPortalActive()) {
            // Already active: cycle to next portal
            const currentIdx = this.PORTAL_TYPES.indexOf(this.state.portalType);
            const nextIdx = (currentIdx + 1) % this.PORTAL_TYPES.length;
            const nextType = this.PORTAL_TYPES[nextIdx];
            this.state.portalType = nextType;
            this.effectsManager.triggerPushPortal(handPos, nextType);
          } else {
            // Open current portal
            const type = this.state.portalType ?? 'NEON';
            this.effectsManager.triggerPushPortal(handPos, type);
          }
          this.state.portalHoldTime = -999;
        }

        this.prevPinch = true;
      } else {
        if (this.prevPinch) this.state.portalHoldTime = 0;
        this.prevPinch = false;
      }

      // ── TWO_FINGERS hold → SMILE spell ───────────────────────────────────
      if (gesture === 'TWO_FINGERS') {
        if (!this.prevTwoFingers) this.state.auroraHoldTime = 0;
        this.state.auroraHoldTime += dt;

        if (this.state.auroraHoldTime >= this.AURORA_HOLD_THRESHOLD && !this.state.auroraActive) {
          this.state.auroraActive = true;
          this.effectsManager.triggerSmile(handPos, 0); // 0 = remain while holding ✌️
        }

        this.prevTwoFingers = true;
      } else {
        if (this.prevTwoFingers) {
          this.state.auroraHoldTime = 0;
          if (this.state.auroraActive) {
            this.state.auroraActive = false;
            this.effectsManager.stopSmile();
          }
        }
        this.prevTwoFingers = false;
      }

      // ── THREE_FINGERS: hold 0.5s to BANISH/CLOSE active portal or smile ────────────
      if (gesture === 'THREE_FINGERS') {
        const portalIsOpen = this.effectsManager.isPortalActive();
        const smileIsOpen = this.effectsManager.isSmileActive();
        if (portalIsOpen || smileIsOpen) {
          if (!this.prevThreeFingers) {
            this.state.portalCloseHoldTime = 0;
          }
          this.state.portalCloseHoldTime += dt;

          if (this.state.portalCloseHoldTime >= this.PORTAL_CLOSE_THRESHOLD) {
            if (portalIsOpen) this.effectsManager.deactivatePortals(handPos);
            if (smileIsOpen) {
              this.effectsManager.stopSmile();
              this.state.auroraActive = false;
            }
            this.state.portalCloseHoldTime = -999;
          }
        } else {
          this.state.portalCloseHoldTime = 0;
        }
        this.prevThreeFingers = true;
      } else {
        if (this.prevThreeFingers) this.state.portalCloseHoldTime = 0;
        this.prevThreeFingers = false;
      }

      // ── FLOWER_BUD 🤌: Sprout blooming flower (only when Flower Mode is explicitly ON) ────
      if (gesture === 'FLOWER_BUD') {
        if (!this.prevFlowerBud) {
          if (this.effectsManager.areFlowersEnabled()) {
            this.effectsManager.spawnFlower(handPos, this.state);
          }
          this.prevFlowerBud = true;
        }
      } else {
        this.prevFlowerBud = false;
      }

      // ── OPEN_PALM 🖐️: Luminous shockwave ring burst on onset ──────────────
      if (gesture === 'OPEN_PALM') {
        if (!this.prevOpenPalm) {
          this.particleSystem.emitShockwaveRing(
            handPos,
            this.state.tier === 'HIGH' ? 60 : this.state.tier === 'MEDIUM' ? 35 : 20
          );
          this.prevOpenPalm = true;
        }
      } else {
        this.prevOpenPalm = false;
      }

      // ── FIST ✊: ~0.4s hold charge → inward gravity storm vortex ───────────
      if (gesture === 'FIST') {
        if (!this.prevFist) {
          this.state.fistHoldTime = 0;
          this.state.fistActive = false;
        }
        this.state.fistHoldTime += dt;
        if (this.state.fistHoldTime >= 0.4) {
          this.state.fistActive = true;
          this.particleSystem.emitGravityStorm(
            handPos,
            this.state.tier === 'HIGH' ? 8 : this.state.tier === 'MEDIUM' ? 5 : 3
          );
        }
        this.prevFist = true;
      } else {
        if (this.prevFist) {
          this.state.fistHoldTime = 0;
          this.state.fistActive = false;
        }
        this.prevFist = false;
      }
    } else {
      if (this.prevFist) {
        this.state.fistHoldTime = 0;
        this.state.fistActive = false;
        this.prevFist = false;
      }
      this.prevOpenPalm = false;
      this.prevPinch = false;
      this.prevTwoFingers = false;
      this.prevThreeFingers = false;
      this.prevFlowerBud = false;
    }

    // ── Update subsystems ────────────────────────────────────────────────────
    this.trailSystem.update(dt);
    this.particleSystem.update(dt, this.state);
    this.effectsManager.update(dt, this.state);

    // Render
    this.renderer.render(this.scene, this.camera);
    this.state.renderTime = performance.now() - renderStart;
    this.onFrameRendered?.();

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.onResize);
  }
}
