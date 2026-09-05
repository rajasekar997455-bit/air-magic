import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { JaggedRingCurve } from './PortalCurves';

const lavaVortexShader = {
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

      // Churning Molten Caldera & Convective Magma Cells
      float swirl = angle + 4.5 / (r * 1.8 + 0.25) - uTime * 2.8;
      vec2 swirlP = vec2(cos(swirl), sin(swirl)) * r;

      // Boiling lava convection cell noise
      float conv1 = fbm(swirlP * 4.5 + vec2(uTime * 0.7, -uTime * 0.5));
      float conv2 = fbm(swirlP * 8.0 - vec2(uTime * 1.1, uTime * 0.8));
      float boilingMagma = mix(conv1, conv2, 0.5);

      // Bubbling plasma bursts
      float bubbles = pow(noise(p * 9.0 + vec2(uTime * 1.5, uTime * 1.2)), 4.0) * 3.0;

      // Volcanic fissure cracks
      float cracks = pow(abs(sin(conv1 * 14.0)), 8.0) * 1.8;

      // Color spectrum: Charcoal basalt rock -> blazing molten orange -> white-hot magma
      vec3 darkBasalt = vec3(0.08, 0.01, 0.0);
      vec3 moltenRed = vec3(0.95, 0.2, 0.0);
      vec3 liquidGold = vec3(1.0, 0.75, 0.05);
      vec3 whiteHotCore = vec3(1.0, 0.95, 0.7);

      float coreEye = smoothstep(0.4, 0.0, r);
      float rimCrust = smoothstep(0.95, 0.7, r);

      vec3 col = mix(darkBasalt, moltenRed, boilingMagma);
      col = mix(col, liquidGold, cracks * 0.8 + bubbles * 0.6);
      col += liquidGold * rimCrust * 0.8;
      col += whiteHotCore * coreEye * 1.8;

      float edgeFade = smoothstep(1.0, 0.91, r);
      float finalAlpha = edgeFade * (0.5 + coreEye * 0.5 + rimCrust * 0.3) * uAlpha;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export class LavaPortal implements PortalRenderer {
  public readonly type = 'LAVA';
  public readonly group = new THREE.Group();

  // Floating basalt crust plates
  private crustGroup = new THREE.Group();
  private crustPlates: THREE.Mesh[] = [];

  // Jagged magma conduits
  private magmaRingOuter!: THREE.Mesh;
  private magmaRingInner!: THREE.Mesh;

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
    // 1. Outer Jagged Magma Fissure Conduit Ring
    const magmaOuterGeom = new THREE.TubeGeometry(new JaggedRingCurve(2.05, 8, 0.45), 240, 0.058, 8, true);
    this.magmaRingOuter = new THREE.Mesh(magmaOuterGeom, makeTubeMat(0xff2200, 0.95));
    this.group.add(this.magmaRingOuter);

    // 2. Inner Jagged Molten Ring
    const magmaInnerGeom = new THREE.TubeGeometry(new JaggedRingCurve(1.35, 12, 0.25), 180, 0.04, 8, true);
    this.magmaRingInner = new THREE.Mesh(magmaInnerGeom, makeTubeMat(0xff7700, 0.9));
    this.magmaRingInner.position.z = -0.1;
    this.group.add(this.magmaRingInner);

    // 3. 10 Floating Dark Basalt Crust Plates
    // Dark charred volcanic rock slabs drifting along the perimeter
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1f1917,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0x220500,
    });
    const plateGeom = new THREE.BoxGeometry(0.5, 0.22, 0.14);

    const plateCount = 10;
    for (let i = 0; i < plateCount; i++) {
      const angle = (i / plateCount) * Math.PI * 2;
      const plate = new THREE.Mesh(plateGeom, plateMat);
      plate.position.set(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 0.05);
      plate.rotation.z = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.2;
      plate.rotation.x = (Math.random() - 0.5) * 0.3;
      this.crustPlates.push(plate);
      this.crustGroup.add(plate);
    }
    this.group.add(this.crustGroup);

    // 4. Molten Caldera Vortex Shader Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: lavaVortexShader.vertexShader,
      fragmentShader: lavaVortexShader.fragmentShader,
      uniforms: this.vortexUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.vortexMesh = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), vortexMat);
    this.vortexMesh.position.z = -0.22;
    this.group.add(this.vortexMesh);
  }

  activate(_scale: number) {
    this.crustGroup.rotation.set(0, 0, 0);
    this.magmaRingOuter.rotation.set(0, 0, 0);
    this.magmaRingInner.rotation.set(0, 0, 0);
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
    // Rotation of magma rings & floating crust plates
    this.magmaRingOuter.rotation.z += 2.4 * dt;
    this.magmaRingInner.rotation.z -= 3.2 * dt;
    this.crustGroup.rotation.z += 0.6 * dt;

    // Basalt plates gentle undulating rock
    for (let i = 0; i < this.crustPlates.length; i++) {
      const p = this.crustPlates[i];
      p.rotation.x = Math.sin(age * 3.0 + i) * 0.15;
    }

    // Shader uniforms
    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // ── Erupting Molten Embers & Fiery Spark Physics ──────────────────────────
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(3, Math.floor(8 * finalScale));

    // 1. Spitting fiery lava embers bursting from caldera rim
    for (let i = 0; i < emitCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = (1.5 + Math.random() * 0.6) * finalScale;
      const px = portalPos.x + Math.cos(angle) * r;
      const py = portalPos.y + Math.sin(angle) * r;
      const pz = portalPos.z + (Math.random() - 0.5) * 0.2;

      // Violent explosive velocity
      const speed = 2.5 + Math.random() * 2.5;
      const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5;
      const vy = Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5;
      const vz = 0.5 + Math.random() * 1.5; // erupting forward

      particleSystem.emitParticle(
        px, py, pz, vx, vy, vz,
        1.0,
        0.3 + Math.random() * 0.5,
        0.02,
        16 + Math.random() * 8,
        0.4,
        0
      );
    }

    // 2. Rising volcanic smoke & soot
    if (Math.random() < 0.4) {
      const smokeAngle = Math.random() * Math.PI * 2;
      const r = (0.2 + Math.random() * 1.0) * finalScale;
      particleSystem.emitParticle(
        portalPos.x + Math.cos(smokeAngle) * r,
        portalPos.y + Math.sin(smokeAngle) * r,
        portalPos.z,
        (Math.random() - 0.5) * 0.4,
        1.2 + Math.random() * 1.0,
        Math.random() * 0.5,
        0.3, 0.1, 0.05,
        22, 1.2, 0
      );
    }
  }

  dispose() {
    this.magmaRingOuter.geometry.dispose();
    (this.magmaRingOuter.material as THREE.Material).dispose();

    this.magmaRingInner.geometry.dispose();
    (this.magmaRingInner.material as THREE.Material).dispose();

    this.crustGroup.traverse((obj) => {
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
