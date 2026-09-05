import type { PerformanceTier, SharedInteractionState } from '../types';

export class PerformanceManager {
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private fpsBuffer: number[] = [];
  private lowFpsCount = 0;
  private highFpsCount = 0;
  public manualTier: PerformanceTier | null = null;

  constructor() { }

  onFrame() {
    this.frameCount++;
  }

  update(state: SharedInteractionState) {
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;

    if (elapsed >= 500) {
      const currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      this.fpsBuffer.push(currentFps);
      if (this.fpsBuffer.length > 6) this.fpsBuffer.shift();

      const avgFps = Math.round(
        this.fpsBuffer.reduce((a, b) => a + b, 0) / this.fpsBuffer.length
      );
      state.fps = avgFps;
      state.frameTime = Number((1000 / Math.max(1, avgFps)).toFixed(1));

      // Auto Tier Management (if not overridden manually)
      if (!this.manualTier) {
        if (avgFps < 32) {
          this.lowFpsCount++;
          if (this.lowFpsCount > 3 && state.tier !== 'LOW') {
            state.tier = 'LOW';
            this.lowFpsCount = 0;
          }
        } else if (avgFps < 48) {
          this.lowFpsCount++;
          if (this.lowFpsCount > 3 && state.tier === 'HIGH') {
            state.tier = 'MEDIUM';
            this.lowFpsCount = 0;
          }
        } else if (avgFps >= 55) {
          this.highFpsCount++;
          if (this.highFpsCount > 6) {
            if (state.tier === 'LOW') state.tier = 'MEDIUM';
            else if (state.tier === 'MEDIUM') state.tier = 'HIGH';
            this.highFpsCount = 0;
          }
        }
      } else {
        state.tier = this.manualTier;
      }
    }
  }

  setTier(tier: PerformanceTier) {
    this.manualTier = tier;
  }
}
