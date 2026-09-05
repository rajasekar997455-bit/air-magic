import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { HeartCurve } from './PortalCurves';

// ═══════════════════════════════════════════════════════════════════════════════
// SYMBOL OF LOVE PORTAL — REDESIGN
// Strict Visual Hierarchy:
// • OUTER CIRCLE: Dense ring of 68 tiny BRIGHT RED hearts (#FF1744) covering the full 360°
// • INNER CENTER: ONE LARGE BRIGHT PINK heart (#FF4FA3) beating with biological pulse
// • 3D DEPTH: Center pink heart floating slightly forward (z = +0.18)
// • NO BLINDING WHITE DISCS: Pure, saturated, high-contrast red & pink glowing geometry
// ═══════════════════════════════════════════════════════════════════════════════

function createHeartShape(scale = 1.0): THREE.Shape {
  const shape = new THREE.Shape();
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // Parametric cardioid heart equation
    const x = 16 * Math.pow(Math.sin(t), 3) * 0.068 * scale;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.068 * scale + 0.18 * scale;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

export class SymbolOfLovePortal implements PortalRenderer {
  public readonly type = 'SYMBOL_OF_LOVE';
  public readonly group = new THREE.Group();

  // 1. Outer Ring of Dense Tiny Red Hearts
  private outerRingGroup = new THREE.Group();
  private tinyHeartMeshes: THREE.Mesh[] = [];
  private tinyTubeGeom!: THREE.TubeGeometry;
  private tinyFillGeom!: THREE.ShapeGeometry;
  private tinyTubeMat!: THREE.MeshBasicMaterial;
  private tinyFillMat!: THREE.MeshBasicMaterial;

  // 2. Center Single Large Pink Heart
  private centerHeartGroup = new THREE.Group();
  private bigHeartTubeMesh!: THREE.Mesh;
  private bigHeartFillMesh!: THREE.Mesh;
  private bigHeartInnerContour!: THREE.Mesh;
  private bigHeartTubeGeom!: THREE.TubeGeometry;
  private bigHeartFillGeom!: THREE.ShapeGeometry;
  private bigHeartInnerGeom!: THREE.TubeGeometry;
  private bigHeartTubeMat!: THREE.MeshBasicMaterial;
  private bigHeartFillMat!: THREE.MeshBasicMaterial;
  private bigHeartInnerMat!: THREE.MeshBasicMaterial;

  // 3. Expanding Pink Heart Energy Wave (radiates outward on heartbeat)
  private pulseWaveMesh!: THREE.Mesh;
  private pulseWaveGeom!: THREE.TubeGeometry;
  private pulseWaveMat!: THREE.MeshBasicMaterial;

  constructor() {
    this.buildGeometry();
  }

  private buildGeometry() {
    // ═════════════════════════════════════════════════════════════════════════
    // 1. OUTER RING: DENSE CHAIN OF 68 TINY BRIGHT RED HEARTS (#FF1744)
    // ═════════════════════════════════════════════════════════════════════════
    this.outerRingGroup = new THREE.Group();
    this.outerRingGroup.position.z = 0.0;

    const tinyScale = 0.135;
    this.tinyTubeGeom = new THREE.TubeGeometry(new HeartCurve(tinyScale), 28, 0.016, 6, true);
    this.tinyFillGeom = new THREE.ShapeGeometry(createHeartShape(tinyScale));

    // Vivid Bright Red materials
    this.tinyTubeMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.tinyFillMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // 68 tiny hearts around radius 2.05 gives seamless gapless coverage
    const count = 68;
    const ringRadius = 2.05;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const y = Math.sin(angle) * ringRadius;

      const heartMeshGroup = new THREE.Group();
      const tube = new THREE.Mesh(this.tinyTubeGeom, this.tinyTubeMat);
      const fill = new THREE.Mesh(this.tinyFillGeom, this.tinyFillMat);
      fill.position.z = -0.005;

      heartMeshGroup.add(tube);
      heartMeshGroup.add(fill);

      heartMeshGroup.position.set(x, y, 0);
      // Orient heart pointing outward radially along the ring
      heartMeshGroup.rotation.z = angle - Math.PI / 2;

      this.tinyHeartMeshes.push(tube, fill);
      this.outerRingGroup.add(heartMeshGroup);
    }
    this.group.add(this.outerRingGroup);

    // ═════════════════════════════════════════════════════════════════════════
    // 2. INNER CENTER: ONE LARGE BRIGHT PINK HEART (#FF4FA3)
    // ═════════════════════════════════════════════════════════════════════════
    this.centerHeartGroup = new THREE.Group();
    // Positioned forward for true 3D layered holographic depth
    this.centerHeartGroup.position.set(0, 0, 0.18);

    const bigScale = 1.48;
    this.bigHeartTubeGeom = new THREE.TubeGeometry(new HeartCurve(bigScale), 120, 0.055, 10, true);
    this.bigHeartFillGeom = new THREE.ShapeGeometry(createHeartShape(bigScale));
    this.bigHeartInnerGeom = new THREE.TubeGeometry(new HeartCurve(bigScale * 0.72), 80, 0.032, 8, true);

    // Premium Bright Pink Materials
    this.bigHeartTubeMat = new THREE.MeshBasicMaterial({
      color: 0xff4fa3,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bigHeartFillMat = new THREE.MeshBasicMaterial({
      color: 0xff4fa3,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.bigHeartInnerMat = new THREE.MeshBasicMaterial({
      color: 0xff85c2,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bigHeartTubeMesh = new THREE.Mesh(this.bigHeartTubeGeom, this.bigHeartTubeMat);
    this.bigHeartFillMesh = new THREE.Mesh(this.bigHeartFillGeom, this.bigHeartFillMat);
    this.bigHeartFillMesh.position.z = -0.01;

    this.bigHeartInnerContour = new THREE.Mesh(this.bigHeartInnerGeom, this.bigHeartInnerMat);
    this.bigHeartInnerContour.position.z = 0.02;

    this.centerHeartGroup.add(this.bigHeartTubeMesh);
    this.centerHeartGroup.add(this.bigHeartFillMesh);
    this.centerHeartGroup.add(this.bigHeartInnerContour);

    this.group.add(this.centerHeartGroup);

    // ═════════════════════════════════════════════════════════════════════════
    // 3. RADIATING PINK HEART ENERGY WAVE
    // ═════════════════════════════════════════════════════════════════════════
    this.pulseWaveGeom = new THREE.TubeGeometry(new HeartCurve(1.5), 90, 0.025, 8, true);
    this.pulseWaveMat = new THREE.MeshBasicMaterial({
      color: 0xff4fa3,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.pulseWaveMesh = new THREE.Mesh(this.pulseWaveGeom, this.pulseWaveMat);
    this.pulseWaveMesh.position.z = 0.12;
    this.group.add(this.pulseWaveMesh);
  }

  activate(_scale: number) {
    this.outerRingGroup.rotation.set(0, 0, 0);
    this.centerHeartGroup.scale.set(1, 1, 1);
    this.pulseWaveMesh.scale.set(1, 1, 1);
    this.pulseWaveMat.opacity = 0;
  }

  update(
    dt: number,
    age: number,
    _maxAge: number,
    envScale: number,
    currentScale: number,
    particleSystem: ParticleSystem,
    portalPos: THREE.Vector3
  ) {
    // 1. Smooth, slow rotation of the full 360° red heart ring
    this.outerRingGroup.rotation.z += 0.28 * dt;

    // Subtle breathing 3D tilt of the outer ring for layered depth
    this.outerRingGroup.rotation.x = Math.sin(age * 1.5) * 0.05;
    this.outerRingGroup.rotation.y = Math.cos(age * 1.2) * 0.05;

    // 2. Center Large Pink Heart: Biological "lub-dub" heartbeat
    const beatTime = age * 2.8;
    const lub = Math.pow(Math.max(0, Math.sin(beatTime)), 6.0) * 0.15;
    const dub = Math.pow(Math.max(0, Math.sin(beatTime + 0.38)), 8.0) * 0.09;
    const heartPulse = 1.0 + lub + dub;
    this.centerHeartGroup.scale.set(heartPulse, heartPulse, heartPulse);

    // Subtle forward floating oscillation
    this.centerHeartGroup.position.z = 0.18 + Math.sin(age * 3.0) * 0.04;

    // 3. Subtle Pink Energy Wave expanding on heartbeat
    const wavePhase = (beatTime / Math.PI) % 1.0;
    const waveScale = 1.0 + wavePhase * 0.45;
    this.pulseWaveMesh.scale.set(waveScale, waveScale, waveScale);
    this.pulseWaveMat.opacity = Math.max(0, (1.0 - wavePhase) * 0.45 * envScale);

    // 4. Subtle, elegant heart-themed floating embers
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(2, Math.floor(6 * finalScale));

    for (let i = 0; i < emitCount; i++) {
      const fromBorder = Math.random() > 0.5;
      let px = portalPos.x;
      let py = portalPos.y;
      let pz = portalPos.z;

      // Outer sparks are PURE RED (#FF1744)
      // Center sparks are PURE PINK (#FF4FA3)
      let r = 1.0;
      let g = 0.09;
      let b = 0.27;

      if (fromBorder) {
        // Along the circular red heart border
        const a = Math.random() * Math.PI * 2;
        const radius = 2.05 * finalScale;
        px += Math.cos(a) * radius;
        py += Math.sin(a) * radius;
        pz += (Math.random() - 0.5) * 0.15;
        r = 1.0; g = 0.09; b = 0.27; // #FF1744
      } else {
        // From the center pink heart
        const ha = Math.random() * Math.PI * 2;
        const hScale = (0.3 + Math.random() * 0.9) * finalScale;
        const hx = 16 * Math.pow(Math.sin(ha), 3) * 0.068 * hScale;
        const hy = (13 * Math.cos(ha) - 5 * Math.cos(2 * ha) - 2 * Math.cos(3 * ha) - Math.cos(4 * ha)) * 0.068 * hScale;
        px += hx;
        py += hy;
        pz += 0.18 * finalScale + (Math.random() - 0.5) * 0.1;
        r = 1.0; g = 0.31; b = 0.64; // #FF4FA3
      }

      // Gentle upward buoyancy
      const vx = (Math.random() - 0.5) * 0.5;
      const vy = 0.3 + Math.random() * 0.5;
      const vz = (Math.random() - 0.5) * 0.3;

      particleSystem.emitParticle(
        px, py, pz,
        vx, vy, vz,
        r, g, b,
        12 + Math.random() * 6,
        0.7 + Math.random() * 0.4,
        0
      );
    }
  }

  dispose() {
    this.tinyTubeGeom.dispose();
    this.tinyFillGeom.dispose();
    this.tinyTubeMat.dispose();
    this.tinyFillMat.dispose();

    this.bigHeartTubeGeom.dispose();
    this.bigHeartFillGeom.dispose();
    this.bigHeartInnerGeom.dispose();
    this.bigHeartTubeMat.dispose();
    this.bigHeartFillMat.dispose();
    this.bigHeartInnerMat.dispose();

    this.pulseWaveGeom.dispose();
    this.pulseWaveMat.dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
