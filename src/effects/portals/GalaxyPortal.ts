import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { CircleCurve, PolygonCurve } from './PortalCurves';

const galaxyVortexShader = {
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

      // Multi-arm logarithmic celestial vortex (Ref Image 1)
      float swirl = angle + 5.5 / (r * 1.5 + 0.25) - uTime * 2.5;
      vec2 swirlP = vec2(cos(swirl), sin(swirl)) * r;

      // Cosmic nebula clouds
      float nebula1 = fbm(swirlP * 4.0 + vec2(uTime * 0.3, -uTime * 0.2));
      float nebula2 = fbm(swirlP * 7.5 - vec2(uTime * 0.5, uTime * 0.4));
      float cloud = mix(nebula1, nebula2, 0.5);

      // 4 Spiral cosmic arms
      float arms = pow(sin(swirl * 4.0 + r * 6.0) * 0.5 + 0.5, 2.5);

      // Star twinkles
      float stars = pow(hash(floor(swirlP * 35.0)), 18.0) * 2.5;

      // Deep celestial colors: deep indigo void -> electric cyan -> brilliant white core
      vec3 voidColor = vec3(0.02, 0.04, 0.15);
      vec3 midColor = vec3(0.0, 0.45, 0.85);
      vec3 armColor = vec3(0.1, 0.9, 1.0);
      vec3 coreColor = vec3(0.8, 0.98, 1.0);

      // Central radiant whirlpool eye
      float coreRadius = 0.22;
      float coreGlow = smoothstep(coreRadius * 1.8, 0.0, r);
      float rimGlow = smoothstep(0.95, 0.7, r);

      vec3 col = mix(voidColor, midColor, smoothstep(0.1, 0.8, r));
      col = mix(col, armColor, (arms * 0.7 + cloud * 0.3));
      col += coreColor * coreGlow * 2.2;
      col += stars * vec3(0.6, 0.9, 1.0);
      col += armColor * rimGlow * 0.8;

      float edgeFade = smoothstep(1.0, 0.92, r);
      float finalAlpha = edgeFade * (0.4 + coreGlow * 0.6 + rimGlow * 0.4) * uAlpha;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export class GalaxyPortal implements PortalRenderer {
  public readonly type = 'GALAXY';
  public readonly group = new THREE.Group();

  // Armillary gyroscopic rings
  private equatorialRing!: THREE.Mesh;
  private tiltedRing1!: THREE.Group;
  private tiltedRing2!: THREE.Group;
  private innerRuneRing!: THREE.Mesh;
  private outerAstrolabeRing!: THREE.Mesh;

  // Celestial satellite nodes
  private satellites: THREE.Mesh[] = [];
  private satelliteGroup = new THREE.Group();

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
    // 1. Primary Equator Ring with cyan runic color (Ref Image 1)
    const eqGeom = new THREE.TubeGeometry(new CircleCurve(2.1), 120, 0.065, 10, true);
    this.equatorialRing = new THREE.Mesh(eqGeom, makeTubeMat(0x00c8ff, 0.95));
    this.group.add(this.equatorialRing);

    // 2. Inscribed Octagonal Runic Astrolabe Ring
    const astroGeom = new THREE.TubeGeometry(new PolygonCurve(8, 1.85, Math.PI / 8), 90, 0.038, 8, true);
    this.outerAstrolabeRing = new THREE.Mesh(astroGeom, makeTubeMat(0x4499ff, 0.9));
    this.outerAstrolabeRing.position.z = -0.05;
    this.group.add(this.outerAstrolabeRing);

    // 3. Tilted Gyroscopic Orbital Ring 1 (Tilted 38° on X axis)
    this.tiltedRing1 = new THREE.Group();
    this.tiltedRing1.rotation.x = Math.PI * 0.22;
    const ring1Geom = new THREE.TubeGeometry(new CircleCurve(2.38), 120, 0.048, 8, true);
    const ring1Mesh = new THREE.Mesh(ring1Geom, makeTubeMat(0x00e5ff, 0.95));
    this.tiltedRing1.add(ring1Mesh);
    this.group.add(this.tiltedRing1);

    // 4. Tilted Gyroscopic Orbital Ring 2 (Tilted -48° on Y axis)
    this.tiltedRing2 = new THREE.Group();
    this.tiltedRing2.rotation.y = -Math.PI * 0.28;
    this.tiltedRing2.rotation.z = Math.PI * 0.12;
    const ring2Geom = new THREE.TubeGeometry(new CircleCurve(2.25), 110, 0.042, 8, true);
    const ring2Mesh = new THREE.Mesh(ring2Geom, makeTubeMat(0x2277ff, 0.9));
    this.tiltedRing2.add(ring2Mesh);
    this.group.add(this.tiltedRing2);

    // 5. Inner Fast-Rotating Runic Core Ring
    const innerGeom = new THREE.TubeGeometry(new CircleCurve(1.25), 90, 0.035, 8, true);
    this.innerRuneRing = new THREE.Mesh(innerGeom, makeTubeMat(0x00ffff, 0.95));
    this.innerRuneRing.position.z = -0.15;
    this.group.add(this.innerRuneRing);

    // 6. Celestial Satellite Nodes (6 orbiting orbs on equatorial plane)
    this.satelliteGroup = new THREE.Group();
    const sphereGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const sphereMat = makeTubeMat(0x77eeff, 1.0);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sat = new THREE.Mesh(sphereGeom, sphereMat);
      sat.position.set(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 0);
      this.satellites.push(sat);
      this.satelliteGroup.add(sat);
    }
    this.group.add(this.satelliteGroup);

    // 7. Celestial Vortex Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: galaxyVortexShader.vertexShader,
      fragmentShader: galaxyVortexShader.fragmentShader,
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
    this.equatorialRing.rotation.set(0, 0, 0);
    this.outerAstrolabeRing.rotation.set(0, 0, 0);
    this.innerRuneRing.rotation.set(0, 0, 0);
    this.satelliteGroup.rotation.set(0, 0, 0);
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
    // Gyroscopic rotations (Ref Image 1 dynamic planetary armillary motion)
    this.equatorialRing.rotation.z += 1.6 * dt;
    this.outerAstrolabeRing.rotation.z -= 1.1 * dt;
    this.innerRuneRing.rotation.z += 3.2 * dt;

    // Asynchronous 3D tumbling of tilted orbital rings
    this.tiltedRing1.rotation.z += 1.4 * dt;
    this.tiltedRing1.rotation.y += 0.3 * dt;
    this.tiltedRing2.rotation.z -= 1.8 * dt;
    this.tiltedRing2.rotation.x += 0.4 * dt;

    // Satellite revolution
    this.satelliteGroup.rotation.z += 1.6 * dt;

    // Shader updates
    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // ── Celestial Stardust & Orbiting Embers Particle Physics ──────────────────
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(3, Math.floor(8 * finalScale));

    // 1. Tangential cyan/starlight perimeter sparkler
    const angle = this.equatorialRing.rotation.z;
    for (let i = 0; i < emitCount; i++) {
      const a = Math.random() * Math.PI * 2 + angle;
      const r = (2.1 + (Math.random() - 0.5) * 0.15) * finalScale;
      const px = portalPos.x + Math.cos(a) * r;
      const py = portalPos.y + Math.sin(a) * r;
      const pz = portalPos.z + (Math.random() - 0.5) * 0.2;

      // Orbiting velocity
      const vx = -Math.sin(a) * 2.0 + (Math.random() - 0.5) * 0.3;
      const vy = Math.cos(a) * 2.0 + (Math.random() - 0.5) * 0.3;
      const vz = (Math.random() - 0.5) * 0.4;

      particleSystem.emitParticle(
        px, py, pz, vx, vy, vz,
        0.05 + Math.random() * 0.2,
        0.75 + Math.random() * 0.25,
        1.0,
        14 + Math.random() * 6,
        0.5,
        0
      );
    }

    // 2. Occasional tilted orbital stardust sparks
    if (Math.random() < 0.4) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.35 * finalScale;
      const tAngle = this.tiltedRing1.rotation.z;
      const px = portalPos.x + Math.cos(a + tAngle) * r;
      const py = portalPos.y + Math.sin(a + tAngle) * r * Math.cos(0.7);
      const pz = portalPos.z + Math.sin(a + tAngle) * r * Math.sin(0.7);

      particleSystem.emitParticle(
        px, py, pz,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        0.7, 0.95, 1.0,
        18, 0.8, 0
      );
    }
  }

  dispose() {
    this.equatorialRing.geometry.dispose();
    (this.equatorialRing.material as THREE.Material).dispose();

    this.outerAstrolabeRing.geometry.dispose();
    (this.outerAstrolabeRing.material as THREE.Material).dispose();

    this.innerRuneRing.geometry.dispose();
    (this.innerRuneRing.material as THREE.Material).dispose();

    this.tiltedRing1.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    this.tiltedRing2.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    for (const s of this.satellites) {
      s.geometry.dispose();
      (s.material as THREE.Material).dispose();
    }

    this.vortexMesh.geometry.dispose();
    (this.vortexMesh.material as THREE.Material).dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
