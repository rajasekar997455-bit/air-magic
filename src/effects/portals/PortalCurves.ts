import * as THREE from 'three';

/** Perfect Circle Curve */
export class CircleCurve extends THREE.Curve<THREE.Vector3> {
  public radius: number;
  constructor(radius = 1.0) {
    super();
    this.radius = radius;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * this.radius, Math.sin(a) * this.radius, 0);
  }
}

/** Parametric 3D Ellipse Curve with optional tilt */
export class Ellipse3DCurve extends THREE.Curve<THREE.Vector3> {
  public xRadius: number;
  public yRadius: number;
  public zElevation: number;
  constructor(
    xRadius = 1.8,
    yRadius = 1.2,
    zElevation = 0.3
  ) {
    super();
    this.xRadius = xRadius;
    this.yRadius = yRadius;
    this.zElevation = zElevation;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(a) * this.xRadius,
      Math.sin(a) * this.yRadius,
      Math.sin(a * 2.0) * this.zElevation
    );
  }
}

/** Classic parametric heart — spinning heart portal outline */
export class HeartCurve extends THREE.Curve<THREE.Vector3> {
  public scale: number;
  constructor(scale = 1.0) {
    super();
    this.scale = scale;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return new THREE.Vector3(x * this.scale * 0.068, y * this.scale * 0.068, 0);
  }
}

/** Rhodonea (rose) curve — botanical petal shapes */
export class RoseCurve extends THREE.Curve<THREE.Vector3> {
  public k: number;
  public scale: number;
  constructor(k = 3, scale = 1.0) {
    super();
    this.k = k;
    this.scale = scale;
  }
  getPoint(t: number): THREE.Vector3 {
    const loops = this.k % 2 === 0 ? 2 : 1;
    const a = t * Math.PI * 2 * loops;
    const r = Math.cos(this.k * a) * this.scale;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
}

/** Star / snowflake — alternates between outer and inner radius */
export class StarCurve extends THREE.Curve<THREE.Vector3> {
  public pts: number;
  public outer: number;
  public inner: number;
  constructor(pts = 6, outer = 1.0, inner = 0.5) {
    super();
    this.pts = pts;
    this.outer = outer;
    this.inner = inner;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2;
    const segAngle = Math.PI / this.pts;
    const i = Math.floor(a / segAngle);
    const f = (a % segAngle) / segAngle;
    const r1 = i % 2 === 0 ? this.outer : this.inner;
    const r2 = i % 2 === 0 ? this.inner : this.outer;
    const a1 = i * segAngle;
    const a2 = a1 + segAngle;
    return new THREE.Vector3(
      Math.cos(a1) * r1 + (Math.cos(a2) * r2 - Math.cos(a1) * r1) * f,
      Math.sin(a1) * r1 + (Math.sin(a2) * r2 - Math.sin(a1) * r1) * f,
      0
    );
  }
}

/** Regular polygon with custom rotation offset */
export class PolygonCurve extends THREE.Curve<THREE.Vector3> {
  public sides: number;
  public radius: number;
  public rotOffset: number;
  constructor(sides = 6, radius = 1.0, rotOffset = 0) {
    super();
    this.sides = sides;
    this.radius = radius;
    this.rotOffset = rotOffset;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2;
    const seg = (Math.PI * 2) / this.sides;
    const i = Math.floor(a / seg) % this.sides;
    const f = (a % seg) / seg;
    const a1 = i * seg + this.rotOffset;
    const a2 = a1 + seg;
    return new THREE.Vector3(
      (Math.cos(a1) + (Math.cos(a2) - Math.cos(a1)) * f) * this.radius,
      (Math.sin(a1) + (Math.sin(a2) - Math.sin(a1)) * f) * this.radius,
      0
    );
  }
}

/** Jagged / spiky ring — layered sine waves on a circle */
export class JaggedRingCurve extends THREE.Curve<THREE.Vector3> {
  public baseR: number;
  public spikes: number;
  public h: number;
  constructor(baseR = 2.0, spikes = 10, h = 0.35) {
    super();
    this.baseR = baseR;
    this.spikes = spikes;
    this.h = h;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2;
    const r = this.baseR
      + Math.sin(a * this.spikes) * this.h
      + Math.sin(a * this.spikes * 2.0) * this.h * 0.3;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
}

/** Archimedean spiral with 3D Z-funnel depth into another dimension */
export class SpiralCurve extends THREE.Curve<THREE.Vector3> {
  public turns: number;
  public maxR: number;
  public zDepth: number;
  constructor(turns = 2.5, maxR = 2.2, zDepth = 0.6) {
    super();
    this.turns = turns;
    this.maxR = maxR;
    this.zDepth = zDepth;
  }
  getPoint(t: number): THREE.Vector3 {
    const a = t * Math.PI * 2 * this.turns;
    const r = (0.05 + t * 0.95) * this.maxR;
    const z = -(1.0 - t) * this.zDepth; // Funnel inward along Z
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
  }
}
