import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { CircleCurve, PolygonCurve, RoseCurve } from './PortalCurves';

// ═══════════════════════════════════════════════════════════════════════════════
// Doctor Strange Kamar-Taj Tao Mandala Procedural Texture Generator
// Produces the exact high-res sacred geometry disc from the movie:
// • Outer circular rune band with 36 Elder Futhark runes
// • 4 Cardinal Seal Medallions with mystic sigils (North, East, South, West)
// • Inscribed 45° sacred diamond / square
// • Inscribed double hexagram (Star of Solomon)
// • Concentric astral rings with radial tick spokes
// • Central sacred Flower of Life / overlapping rosette
// • Radiant incandescence and golden bloom
// ═══════════════════════════════════════════════════════════════════════════════

function createDoctorStrangeMandalaTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Helper for drawing circles
  const drawCircle = (r: number, strokeColor: string, lineWidth: number, blur = 10) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = blur;
    ctx.stroke();
    ctx.restore();
  };

  // 1. Outer Blazing Fiery Rim
  drawCircle(475, '#ff7700', 6, 20);
  drawCircle(470, '#ffbb22', 3, 14);
  drawCircle(465, '#fff0aa', 1.8, 10);

  // 2. Outer Rune Band (Radius 425 to 465)
  drawCircle(425, '#ff9900', 2.5, 12);

  // Draw 36 Sacred Runes around the circular band
  const runes = [
    'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ',
    'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ',
    'ᚱ', 'ᚢ', 'ᚾ', 'ᚨ', 'ᛋ', 'ᛏ', 'ᚱ', 'ᚨ', 'ᚾ', 'ᚷ', 'ᛖ', 'ᛟ'
  ];

  ctx.save();
  ctx.font = 'bold 22px "Segoe UI Historic", "Segoe UI Symbol", "Apple Symbols", "Noto Sans Runic", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffcc33';
  ctx.shadowColor = '#ff8800';
  ctx.shadowBlur = 10;

  for (let i = 0; i < runes.length; i++) {
    const angle = (i / runes.length) * Math.PI * 2;
    const rx = cx + Math.cos(angle) * 445;
    const ry = cy + Math.sin(angle) * 445;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(runes[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // 3. 4 Cardinal Nodal Seal Medallions (Top: 12h, Right: 3h, Bottom: 6h, Left: 9h)
  const nodalAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  nodalAngles.forEach((angle, idx) => {
    const nx = cx + Math.cos(angle) * 445;
    const ny = cy + Math.sin(angle) * 445;

    ctx.save();
    // Medallion background backing
    ctx.beginPath();
    ctx.arc(nx, ny, 34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(25, 12, 2, 0.75)';
    ctx.fill();

    // Medallion outer double circle
    ctx.beginPath();
    ctx.arc(nx, ny, 34, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(nx, ny, 26, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Inscribed arcane sigil per medallion
    ctx.translate(nx, ny);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.strokeStyle = '#ffe677';
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 8;

    if (idx === 0) {
      // Top: Inverted trident / Kamar-Taj anchor
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 18);
      ctx.moveTo(-12, -8);
      ctx.lineTo(12, -8);
      ctx.moveTo(-10, 8);
      ctx.lineTo(0, 18);
      ctx.lineTo(10, 8);
    } else if (idx === 1) {
      // Right: Eye of Agamotto / oval knot
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
    } else if (idx === 2) {
      // Bottom: Mystic chalice / crucible
      ctx.arc(0, -2, 14, 0, Math.PI);
      ctx.moveTo(0, 12);
      ctx.lineTo(0, 18);
      ctx.moveTo(-8, 18);
      ctx.lineTo(8, 18);
    } else {
      // Left: 8-ray astral burst
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI;
        ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.lineTo(-Math.cos(a) * 14, -Math.sin(a) * 14);
      }
    }
    ctx.stroke();
    ctx.restore();
  });

  // 4. Inscribed 45° Sacred Diamond / Square
  ctx.save();
  ctx.beginPath();
  const sqR = 422;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = cx + Math.cos(a) * sqR;
    const py = cy + Math.sin(a) * sqR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = '#ffbb22';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#ff8800';
  ctx.shadowBlur = 14;
  ctx.stroke();

  // Secondary inner square
  ctx.beginPath();
  const sqR2 = 412;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = cx + Math.cos(a) * sqR2;
    const py = cy + Math.sin(a) * sqR2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // 5. Concentric Astral Circles (Radius 330 & 295) with Radial Tick Spokes
  drawCircle(330, '#ff9900', 3, 10);
  drawCircle(295, '#ffbb33', 2, 8);

  ctx.save();
  ctx.strokeStyle = '#ffaa11';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 6;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const r1 = 295;
    const r2 = isMajor ? 330 : 315;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Inscribed Sacred Hexagram (Star of Solomon / Two Interlocking Triangles)
  const drawEquilateralTriangle = (r: number, rotOffset: number, color: string, w: number) => {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + rotOffset;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  };

  // Outer Hexagram pair
  drawEquilateralTriangle(292, -Math.PI / 2, '#ffdd44', 3.2);
  drawEquilateralTriangle(292, Math.PI / 2, '#ffaa22', 3.2);

  // Inner Hexagram pair
  drawEquilateralTriangle(275, -Math.PI / 2, '#ff8800', 1.6);
  drawEquilateralTriangle(275, Math.PI / 2, '#ff7700', 1.6);

  // 7. Inner Concentric Rings
  drawCircle(210, '#ff9900', 2.8, 10);
  drawCircle(180, '#ffcc44', 2.2, 8);

  // 8. Central Sacred Flower of Life / Overlapping Rosette
  ctx.save();
  const flowerR = 64;
  ctx.strokeStyle = '#ffee66';
  ctx.lineWidth = 2.4;
  ctx.shadowColor = '#ffbb00';
  ctx.shadowBlur = 14;

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, flowerR, 0, Math.PI * 2);
  ctx.stroke();

  // 6 First-ring overlapping petals
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = cx + Math.cos(a) * flowerR;
    const py = cy + Math.sin(a) * flowerR;
    ctx.beginPath();
    ctx.arc(px, py, flowerR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 12 Secondary outer petal arcs
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = cx + Math.cos(a) * (flowerR * 1.732);
    const py = cy + Math.sin(a) * (flowerR * 1.732);
    ctx.beginPath();
    ctx.arc(px, py, flowerR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 9. Central Radiant Solar Flare Core
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
  coreGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
  coreGrad.addColorStop(0.2, 'rgba(255, 220, 80, 0.8)');
  coreGrad.addColorStop(0.5, 'rgba(255, 140, 10, 0.4)');
  coreGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class NeonPortal implements PortalRenderer {
  public readonly type = 'NEON';
  public readonly group = new THREE.Group();

  // 3D Sacred Geometry Meshes
  private outerSparkRing!: THREE.Mesh;
  private hexagramGroup = new THREE.Group();
  private triangle1Mesh!: THREE.Mesh;
  private triangle2Mesh!: THREE.Mesh;
  private squareMesh!: THREE.Mesh;
  private flowerOfLifeMesh!: THREE.Mesh;

  // High-Resolution Tao Mandala Plane Meshes
  private mandalaTexture!: THREE.CanvasTexture;
  private mandalaMesh!: THREE.Mesh;
  private counterMandalaMesh!: THREE.Mesh;

  constructor() {
    this.buildGeometry();
  }

  private buildGeometry() {
    // 1. High-Resolution Doctor Strange Tao Mandala Textured Disc
    this.mandalaTexture = createDoctorStrangeMandalaTexture();
    const mandalaMat = new THREE.MeshBasicMaterial({
      map: this.mandalaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const discGeom = new THREE.PlaneGeometry(4.4, 4.4);
    this.mandalaMesh = new THREE.Mesh(discGeom, mandalaMat);
    this.mandalaMesh.position.z = -0.1;
    this.group.add(this.mandalaMesh);

    // Counter-rotating subtle backdrop layer for multi-plane arcane depth
    const counterMat = new THREE.MeshBasicMaterial({
      map: this.mandalaTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.counterMandalaMesh = new THREE.Mesh(discGeom, counterMat);
    this.counterMandalaMesh.position.z = -0.22;
    this.group.add(this.counterMandalaMesh);

    // 2. 3D Outer Blazing Sparkler Hoop (Incandescent Ring)
    const outerGeom = new THREE.TubeGeometry(new CircleCurve(2.1), 120, 0.055, 10, true);
    this.outerSparkRing = new THREE.Mesh(outerGeom, makeTubeMat(0xff9900, 0.98));
    this.group.add(this.outerSparkRing);

    // 3. 3D Sacred Hexagram Group
    this.hexagramGroup = new THREE.Group();
    this.hexagramGroup.position.z = -0.04;

    const tri1Geom = new THREE.TubeGeometry(new PolygonCurve(3, 1.82, -Math.PI / 2), 90, 0.034, 8, true);
    this.triangle1Mesh = new THREE.Mesh(tri1Geom, makeTubeMat(0xffdd44, 0.95));
    this.hexagramGroup.add(this.triangle1Mesh);

    const tri2Geom = new THREE.TubeGeometry(new PolygonCurve(3, 1.82, Math.PI / 2), 90, 0.034, 8, true);
    this.triangle2Mesh = new THREE.Mesh(tri2Geom, makeTubeMat(0xffaa11, 0.95));
    this.hexagramGroup.add(this.triangle2Mesh);
    this.group.add(this.hexagramGroup);

    // 4. 3D Inscribed Square (Rotated 45°)
    const sqGeom = new THREE.TubeGeometry(new PolygonCurve(4, 1.55, Math.PI / 4), 80, 0.03, 8, true);
    this.squareMesh = new THREE.Mesh(sqGeom, makeTubeMat(0xffbb22, 0.92));
    this.squareMesh.position.z = -0.07;
    this.group.add(this.squareMesh);

    // 5. 3D Central Rosette
    const flowerGeom = new THREE.TubeGeometry(new RoseCurve(6, 0.68), 180, 0.024, 8, true);
    this.flowerOfLifeMesh = new THREE.Mesh(flowerGeom, makeTubeMat(0xffee66, 0.96));
    this.flowerOfLifeMesh.position.z = -0.15;
    this.group.add(this.flowerOfLifeMesh);
  }

  activate(_scale: number) {
    this.outerSparkRing.rotation.set(0, 0, 0);
    this.hexagramGroup.rotation.set(0, 0, 0);
    this.squareMesh.rotation.set(0, 0, 0);
    this.flowerOfLifeMesh.rotation.set(0, 0, 0);
    this.mandalaMesh.rotation.set(0, 0, 0);
    this.counterMandalaMesh.rotation.set(0, 0, 0);
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
    // Harmonic rotation of concentric sacred geometry layers
    this.outerSparkRing.rotation.z += 2.6 * dt;
    this.mandalaMesh.rotation.z += 0.45 * dt;
    this.counterMandalaMesh.rotation.z -= 0.65 * dt;
    this.hexagramGroup.rotation.z -= 1.4 * dt;
    this.squareMesh.rotation.z += 1.8 * dt;
    this.flowerOfLifeMesh.rotation.z += 1.2 * dt;

    // Pulsate central rosette and mandala glow
    const pulse = 1.0 + Math.sin(age * 5.0) * 0.04;
    this.flowerOfLifeMesh.scale.setScalar(pulse);

    // ── Tangential "Arc-Welder" Sling Ring Sparkler Physics ───────────────────
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(4, Math.floor(16 * finalScale));

    const ringAngle = this.outerSparkRing.rotation.z;
    for (let i = 0; i < emitCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.08 * finalScale;

      const px = portalPos.x + Math.cos(a + ringAngle) * r;
      const py = portalPos.y + Math.sin(a + ringAngle) * r;
      const pz = portalPos.z + (Math.random() - 0.5) * 0.1;

      // Tangential velocity spraying off the spinning ring like an abrasive grinder / sling ring
      const tanX = -Math.sin(a + ringAngle);
      const tanY = Math.cos(a + ringAngle);
      const speed = 2.6 + Math.random() * 2.8;

      // Outward centrifugal push + tangential spray + slight gravity drift
      const outwardX = Math.cos(a + ringAngle) * 0.5;
      const outwardY = Math.sin(a + ringAngle) * 0.5;

      const vx = (tanX * speed + outwardX) + (Math.random() - 0.5) * 0.6;
      const vy = (tanY * speed + outwardY) + (Math.random() - 0.5) * 0.6 - 0.35;
      const vz = (Math.random() - 0.5) * 0.6;

      // Bright incandescent gold & amber sparks with white core
      particleSystem.emitParticle(
        px, py, pz, vx, vy, vz,
        1.0,
        0.75 + Math.random() * 0.25,
        0.15 + Math.random() * 0.35,
        15 + Math.random() * 9,
        0.45, // short sizzle lifespan
        0
      );
    }
  }

  dispose() {
    this.outerSparkRing.geometry.dispose();
    (this.outerSparkRing.material as THREE.Material).dispose();

    this.triangle1Mesh.geometry.dispose();
    (this.triangle1Mesh.material as THREE.Material).dispose();

    this.triangle2Mesh.geometry.dispose();
    (this.triangle2Mesh.material as THREE.Material).dispose();

    this.squareMesh.geometry.dispose();
    (this.squareMesh.material as THREE.Material).dispose();

    this.flowerOfLifeMesh.geometry.dispose();
    (this.flowerOfLifeMesh.material as THREE.Material).dispose();

    this.mandalaMesh.geometry.dispose();
    (this.mandalaMesh.material as THREE.Material).dispose();

    this.counterMandalaMesh.geometry.dispose();
    (this.counterMandalaMesh.material as THREE.Material).dispose();

    this.mandalaTexture.dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
