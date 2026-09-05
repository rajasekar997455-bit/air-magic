import { OneEuroFilter } from '../utils/Math';
import type { Landmark } from '../types';

export class LandmarkSmoother {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;
  private zFilter: OneEuroFilter;
  private prevX: number | null = null;
  private prevY: number | null = null;
  private prevTime: number = 0;
  private vx: number = 0;
  private vy: number = 0;

  constructor(minCutoff = 1.2, beta = 0.015, dCutoff = 1.0) {
    this.xFilter = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.yFilter = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.zFilter = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  smooth(raw: Landmark, timestamp: number = performance.now() / 1000): {
    smoothed: Landmark;
    velocity: { x: number; y: number };
  } {
    const smoothedX = this.xFilter.filter(raw.x, timestamp);
    const smoothedY = this.yFilter.filter(raw.y, timestamp);
    const smoothedZ = this.zFilter.filter(raw.z, timestamp);

    if (this.prevX !== null && this.prevY !== null && this.prevTime > 0) {
      const dt = Math.max(timestamp - this.prevTime, 0.001);
      const instantVx = (smoothedX - this.prevX) / dt;
      const instantVy = (smoothedY - this.prevY) / dt;

      // Smooth the velocity with EMA
      this.vx = 0.7 * instantVx + 0.3 * this.vx;
      this.vy = 0.7 * instantVy + 0.3 * this.vy;
    }

    this.prevX = smoothedX;
    this.prevY = smoothedY;
    this.prevTime = timestamp;

    return {
      smoothed: { x: smoothedX, y: smoothedY, z: smoothedZ },
      velocity: { x: this.vx, y: this.vy },
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
    this.prevX = null;
    this.prevY = null;
    this.prevTime = 0;
    this.vx = 0;
    this.vy = 0;
  }
}
