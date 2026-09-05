import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { CircleCurve, PolygonCurve } from './PortalCurves';

const iceVortexShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uAlpha;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.0 + vec2(100.0);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = (vUv - vec2(0.5)) * 2.0;
      float r = length(p);
      if (r > 1.0) discard;

      float angle = atan(p.y, p.x);

      // Sub-Zero Glacial Blizzard Vortex (Ref Image 5)
      // High-speed frosty swirl
      float swirl = angle + 6.0 / (r * 1.6 + 0.22) - uTime * 3.2;
      vec2 swirlP = vec2(cos(swirl), sin(swirl)) * r;

      // Howling blizzard wind patterns
      float blizzard1 = fbm(swirlP * 5.0 + vec2(uTime * 0.6, -uTime * 0.4));
      float blizzard2 = fbm(swirlP * 9.0 - vec2(uTime * 0.9, uTime * 0.7));
      float frostCloud = mix(blizzard1, blizzard2, 0.5);

      // Hexagonal ice crystal diffraction lines (6-fold snowflake symmetry)
      float hexDiffraction = pow(cos(angle * 6.0) * 0.5 + 0.5, 8.0);
      float subDiffraction = pow(cos(angle * 12.0 + uTime) * 0.5 + 0.5, 12.0);

      // Deep glacial abyss -> crystalline cyan -> brilliant frost white
      vec3 deepGlacial = vec3(0.02, 0.12, 0.28);
      vec3 iceCyan = vec3(0.35, 0.78, 0.95);
      vec3 frostWhite = vec3(0.92, 0.98, 1.0);

      float coreEye = smoothstep(0.35, 0.0, r);
      float rimFrost = smoothstep(0.95, 0.65, r);

      vec3 col = mix(deepGlacial, iceCyan, frostCloud * 0.7 + rimFrost * 0.3);
      col += frostWhite * (hexDiffraction * 0.6 + subDiffraction * 0.4);
      col += frostWhite * coreEye * 1.8;

      float edgeFade = smoothstep(1.0, 0.93, r);
      float finalAlpha = edgeFade * (0.45 + coreEye * 0.55 + rimFrost * 0.3) * uAlpha;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export class IcePortal implements PortalRenderer {
  public readonly type = 'ICE';
  public readonly group = new THREE.Group();

  // 3D Glacial Crystal Obelisks (Ref Image 5)
  private crystalGroup = new THREE.Group();
  private crystals: THREE.Mesh[] = [];

  // Frosted foundation rings
  private frostedRingOuter!: THREE.Mesh;
  private frostedRingInner!: THREE.Mesh;

  // Vortex shader
  private vortexMesh!: THREE.Mesh;
  private vortexUniforms = {
    uTime: { value: 0 },
    uAlpha: { value: 1.0 },
  };

  constructor() {
    this.buildGeometry();
  }

  private buildGeometry() {
    // 1. Frosted Glacial Foundation Rings
    const ringGeomOuter = new THREE.TubeGeometry(new CircleCurve(2.1), 120, 0.055, 8, true);
    this.frostedRingOuter = new THREE.Mesh(ringGeomOuter, makeTubeMat(0x66ccff, 0.95));
    this.group.add(this.frostedRingOuter);

    const ringGeomInner = new THREE.TubeGeometry(new PolygonCurve(12, 1.75, 0), 90, 0.038, 8, true);
    this.frostedRingInner = new THREE.Mesh(ringGeomInner, makeTubeMat(0xaaeeff, 0.9));
    this.frostedRingInner.position.z = -0.06;
    this.group.add(this.frostedRingInner);

    // 2. Ring of 18 Procedural 3D Ice Crystal Obelisks (Ref Image 5)
    // Faceted 4-sided diamond prisms with sharp tips protruding radially inward and outward
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x99ddff,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      emissive: 0x114466,
    });

    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Varied height, radius and tilt to replicate natural jagged glacial shards
      const isLarge = i % 3 === 0;
      const height = isLarge ? 1.25 : 0.8 + (i % 4) * 0.12;
      const radius = isLarge ? 0.22 : 0.14;

      // 4-sided faceted pyramid/obelisk
      const crystalGeom = new THREE.ConeGeometry(radius, height, 4);
      const crystal = new THREE.Mesh(crystalGeom, crystalMat);

      // Position along perimeter
      const dist = 2.1 + (isLarge ? 0.15 : -0.1);
      crystal.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, (Math.random() - 0.5) * 0.15);

      // Point radially with slight inward/outward angle
      crystal.rotation.z = angle - Math.PI / 2;
      crystal.rotation.x = (isLarge ? 0.35 : -0.2) + (Math.random() - 0.5) * 0.2;
      crystal.rotation.y = (Math.random() - 0.5) * 0.3;

      this.crystals.push(crystal);
      this.crystalGroup.add(crystal);
    }
    this.group.add(this.crystalGroup);

    // 3. Sub-Zero Blizzard Vortex Shader Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: iceVortexShader.vertexShader,
      fragmentShader: iceVortexShader.fragmentShader,
      uniforms: this.vortexUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.vortexMesh = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), vortexMat);
    this.vortexMesh.position.z = -0.25;
    this.group.add(this.vortexMesh);
  }

  activate(_scale: number) {
    this.crystalGroup.rotation.set(0, 0, 0);
    this.frostedRingOuter.rotation.set(0, 0, 0);
    this.frostedRingInner.rotation.set(0, 0, 0);
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
    // Slow, majestic rotation of the ice obelisks
    this.crystalGroup.rotation.z += 0.45 * dt;
    this.frostedRingOuter.rotation.z += 0.8 * dt;
    this.frostedRingInner.rotation.z -= 0.6 * dt;

    // Specular shimmer across crystal facets
    const glint = 0.75 + Math.sin(age * 5.0) * 0.2;
    for (let i = 0; i < this.crystals.length; i++) {
      const c = this.crystals[i];
      c.scale.setScalar(1.0 + Math.sin(age * 4.0 + i) * 0.03);
      (c.material as THREE.MeshStandardMaterial).opacity = glint;
    }

    // Shader uniforms
    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // ── Diamond Frost Sparkles & Howling Blizzard Particles ───────────────────
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(2, Math.floor(6 * finalScale));

    // 1. Frost sparkles detaching from the sharp crystal obelisk tips
    for (let i = 0; i < emitCount; i++) {
      const idx = Math.floor(Math.random() * this.crystals.length);
      const angle = (idx / this.crystals.length) * Math.PI * 2 + this.crystalGroup.rotation.z;
      const r = (2.1 + (Math.random() - 0.5) * 0.3) * finalScale;
      const px = portalPos.x + Math.cos(angle) * r;
      const py = portalPos.y + Math.sin(angle) * r;
      const pz = portalPos.z + (Math.random() - 0.5) * 0.3;

      particleSystem.emitParticle(
        px, py, pz,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        Math.random() * 0.6,
        0.85, 0.96, 1.0,
        18 + Math.random() * 6,
        0.8,
        0
      );
    }

    // 2. Sub-zero mist drifting outward from the vortex center
    if (Math.random() < 0.5) {
      const mistAngle = Math.random() * Math.PI * 2;
      const r = (0.3 + Math.random() * 1.2) * finalScale;
      particleSystem.emitParticle(
        portalPos.x + Math.cos(mistAngle) * r,
        portalPos.y + Math.sin(mistAngle) * r,
        portalPos.z,
        -Math.sin(mistAngle) * 2.2,
        Math.cos(mistAngle) * 2.2,
        0.2,
        0.5, 0.85, 1.0,
        14, 0.6, 0
      );
    }
  }

  dispose() {
    this.frostedRingOuter.geometry.dispose();
    (this.frostedRingOuter.material as THREE.Material).dispose();

    this.frostedRingInner.geometry.dispose();
    (this.frostedRingInner.material as THREE.Material).dispose();

    this.crystalGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    this.vortexMesh.geometry.dispose();
    (this.vortexMesh.material as THREE.Material).dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
