export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance3D(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Low-pass exponential moving average filter with velocity compensation
 */
export class ExponentialFilter {
  private value: number | null = null;
  private alpha: number;

  constructor(alpha: number = 0.5) {
    this.alpha = clamp(alpha, 0.01, 1.0);
  }

  setAlpha(alpha: number) {
    this.alpha = clamp(alpha, 0.01, 1.0);
  }

  filter(val: number): number {
    if (this.value === null) {
      this.value = val;
    } else {
      this.value = this.alpha * val + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset(val?: number) {
    this.value = val !== undefined ? val : null;
  }

  get current(): number {
    return this.value ?? 0;
  }
}

/**
 * 1€ Filter (One Euro Filter) - State of the art filter for jitter reduction with low lag
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x: number, timestamp: number = performance.now() / 1000): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = timestamp;
      this.xPrev = x;
      this.dxPrev = 0;
      return x;
    }

    const dt = Math.max(timestamp - this.tPrev, 0.001);
    this.tPrev = timestamp;

    // Calculate derivative
    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    // Filter signal with dynamic cutoff
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;

    return xHat;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}
