import type { SharedInteractionState } from '../types';
import type { CoordinateMapper } from '../utils/Coordinates';

export class DemoController {
  private state: SharedInteractionState;
  private coordinateMapper: CoordinateMapper | null = null;
  private isRunning = false;
  private startTime = 0;
  private animationFrameId: number | null = null;

  constructor(state: SharedInteractionState) {
    this.state = state;
  }

  setCoordinateMapper(mapper: CoordinateMapper) {
    this.coordinateMapper = mapper;
  }

  start() {
    this.isRunning = true;
    this.state.isDemoMode = true;
    this.state.handDetected = true;
    this.state.confidence = 0.98;
    this.startTime = performance.now();

    // Initialize worldFingertip to screen center so particles emit immediately
    if (this.coordinateMapper) {
      const worldVec = this.coordinateMapper.screenToWorld(0.5, 0.5, 0);
      this.state.worldFingertip = { x: worldVec.x, y: worldVec.y, z: worldVec.z };
    } else {
      this.state.worldFingertip = { x: 0, y: 0, z: 0 };
    }

    this.loop();
  }

  stop() {
    this.isRunning = false;
    this.state.isDemoMode = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    const elapsed = (performance.now() - this.startTime) / 1000;
    const cycleTime = 18.0; // 18-second comprehensive demo loop
    const t = elapsed % cycleTime;

    let sx = 0.5;
    let sy = 0.5;
    let isDrawing = false;
    let gesture: any = 'IDLE';

    // Phase 1: 0s - 4.5s -> Write "MAGIC" in the air
    if (t < 4.5) {
      gesture = 'POINT';
      isDrawing = true;
      const writeT = t / 4.5;

      // Cursive 'M' wave + magic flourishes
      if (writeT < 0.25) {
        // First arch
        const localT = writeT / 0.25;
        sx = 0.25 + localT * 0.12;
        sy = 0.7 - Math.sin(localT * Math.PI) * 0.35;
      } else if (writeT < 0.5) {
        // Second arch
        const localT = (writeT - 0.25) / 0.25;
        sx = 0.37 + localT * 0.12;
        sy = 0.7 - Math.sin(localT * Math.PI) * 0.35;
      } else if (writeT < 0.75) {
        // Loop 'A' - 'G'
        const localT = (writeT - 0.5) / 0.25;
        const angle = localT * Math.PI * 2;
        sx = 0.55 + Math.cos(angle) * 0.08;
        sy = 0.55 + Math.sin(angle) * 0.15;
      } else {
        // 'I' - 'C' flourish slash
        const localT = (writeT - 0.75) / 0.25;
        sx = 0.65 + localT * 0.15;
        sy = 0.4 + localT * 0.25;
      }
    }
    // Phase 2: 4.5s - 6.0s -> Stroke timeout & Magic Portal Trigger
    else if (t < 6.0) {
      isDrawing = false;
      gesture = 'POINT';
      sx = 0.8;
      sy = 0.65;

      if (t > 5.2 && !this.state.recognizedWord) {
        this.state.recognizedWord = 'MAGIC';
        this.state.wordConfidence = 0.96;
        this.state.recognizedTimestamp = performance.now();
      }
    }
    // Phase 3: 6.0s - 8.0s -> Open Palm (Repulsive Shockwave)
    else if (t < 8.0) {
      gesture = 'OPEN_PALM';
      isDrawing = false;
      const waveT = (t - 6.0) / 2.0;
      sx = 0.5 + Math.sin(waveT * Math.PI * 3) * 0.2;
      sy = 0.5 + Math.cos(waveT * Math.PI * 2) * 0.15;
      this.state.recognizedWord = null;
    }
    // Phase 4: 8.0s - 10.0s -> Pinch (Plasma Ball & Lightning)
    else if (t < 10.0) {
      gesture = 'PINCH';
      isDrawing = false;
      sx = 0.5 + Math.cos(t * 2) * 0.15;
      sy = 0.5 + Math.sin(t * 2) * 0.15;
    }
    // Phase 5: 10.0s - 11.0s -> Three Fingers (Close active portal)
    else if (t < 11.0) {
      gesture = 'THREE_FINGERS';
      isDrawing = false;
      sx = 0.5;
      sy = 0.5;
    }
    // Phase 6: 11.0s - 12.0s -> Fist (Gravitational Attraction)
    else if (t < 12.0) {
      gesture = 'FIST';
      isDrawing = false;
      sx = 0.5;
      sy = 0.5;
    }
    // Phase 7: 12.0s - 18.0s -> Two Fingers ✌️ (Hold 2s for SMILE Spell, then display for 4s)
    else {
      gesture = 'TWO_FINGERS';
      isDrawing = false;
      sx = 0.5 + Math.sin((t - 12.0) * Math.PI * 0.5) * 0.04;
      sy = 0.5 + Math.cos((t - 12.0) * Math.PI * 0.5) * 0.04;
    }

    this.state.screenFingertip = { x: sx, y: sy };
    this.state.gesture = gesture;
    this.state.isDrawing = isDrawing;

    if (this.coordinateMapper) {
      const worldVec = this.coordinateMapper.screenToWorld(sx, sy, 0);
      this.state.worldFingertip = {
        x: worldVec.x,
        y: worldVec.y,
        z: worldVec.z,
      };
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
