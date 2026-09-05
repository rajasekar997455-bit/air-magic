import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { SpiralCurve, CircleCurve } from './PortalCurves';

const voidVortexShader = {
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

      // Gravitational Singularity & Inward Swirl
      float swirl = angle + 8.0 / (r * 2.0 + 0.18) - uTime * 3.5;
      vec2 swirlP = vec2(cos(swirl), sin(swirl)) * r;

      // Event Horizon / Schwarzschild radius: true impenetrable blackness
      float eventHorizon = 0.32;
      if (r < eventHorizon) {
        // Pure black singularity core with subtle violet edge bleed
        float edgeBleed = smoothstep(eventHorizon * 0.7, eventHorizon, r) * 0.25;
        gl_FragColor = vec4(vec3(0.05, 0.0, 0.12) * edgeBleed, edgeBleed * uAlpha);
        return;
      }

      // Relativistic Doppler Beaming (one side of disk is boosted by relativistic velocity)
      float doppler = 1.0 + sin(angle + 0.3) * 0.45;

      // Accretion disk plasma filaments
      float diskNoise = fbm(swirlP * 6.5 + vec2(uTime * 0.8, -uTime * 0.5));

      // Gravitational lensing photon ring (extremely bright razor-thin circular ring)
      float photonRing = smoothstep(eventHorizon, eventHorizon + 0.03, r) *
                         (1.0 - smoothstep(eventHorizon + 0.03, eventHorizon + 0.08, r));

      // Deep ultraviolet Hawking radiation & purple cosmic void
      vec3 voidPurple = vec3(0.18, 0.02, 0.42);
      vec3 plasmaViolet = vec3(0.65, 0.15, 1.0);
      vec3 photonGlow = vec3(0.95, 0.75, 1.0);

      vec3 col = mix(voidPurple, plasmaViolet, diskNoise * 0.7);
      col *= doppler;
      col += photonGlow * photonRing * 3.0; // intense glowing photon sphere

      float edgeFade = smoothstep(1.0, 0.88, r);
      float finalAlpha = edgeFade * (0.6 + photonRing * 0.4) * uAlpha;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export class VoidPortal implements PortalRenderer {
  public readonly type = 'VOID';
  public readonly group = new THREE.Group();

  // 3D Inward Funnel Spiral Accretion Arms
  private funnelSpiral1!: THREE.Mesh;
  private funnelSpiral2!: THREE.Mesh;
  private eventHorizonRing!: THREE.Mesh;
  private outerPhotonRing!: THREE.Mesh;

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
    // 1. 3D Inward Funnel Spiral Accretion Arm 1 (Z-depth sinking inward)
    const spiralGeom1 = new THREE.TubeGeometry(new SpiralCurve(2.8, 2.25, 0.75), 240, 0.045, 8, false);
    this.funnelSpiral1 = new THREE.Mesh(spiralGeom1, makeTubeMat(0x6600ff, 0.95));
    this.group.add(this.funnelSpiral1);

    // 2. 3D Inward Funnel Spiral Accretion Arm 2 (Counter-rotated)
    const spiralGeom2 = new THREE.TubeGeometry(new SpiralCurve(2.2, 1.7, 0.55), 200, 0.038, 8, false);
    this.funnelSpiral2 = new THREE.Mesh(spiralGeom2, makeTubeMat(0x9900ee, 0.9));
    this.funnelSpiral2.rotation.z = Math.PI;
    this.group.add(this.funnelSpiral2);

    // 3. Relativistic Photon Ring right at the Event Horizon
    const photonGeom = new THREE.TorusGeometry(0.72, 0.03, 12, 64);
    this.eventHorizonRing = new THREE.Mesh(photonGeom, makeTubeMat(0xcc66ff, 1.0));
    this.eventHorizonRing.position.z = -0.3;
    this.group.add(this.eventHorizonRing);

    // 4. Outer Gravitational Lensing Boundary
    const outerGeom = new THREE.TubeGeometry(new CircleCurve(2.25), 100, 0.035, 8, true);
    this.outerPhotonRing = new THREE.Mesh(outerGeom, makeTubeMat(0x330088, 0.85));
    this.group.add(this.outerPhotonRing);

    // 5. Singularity Vortex Shader Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: voidVortexShader.vertexShader,
      fragmentShader: voidVortexShader.fragmentShader,
      uniforms: this.vortexUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.vortexMesh = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), vortexMat);
    this.vortexMesh.position.z = -0.35;
    this.group.add(this.vortexMesh);
  }

  activate(_scale: number) {
    this.funnelSpiral1.rotation.set(0, 0, 0);
    this.funnelSpiral2.rotation.set(0, 0, Math.PI);
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
    // Relativistic inward suction rotation
    this.funnelSpiral1.rotation.z -= 1.6 * dt;
    this.funnelSpiral2.rotation.z += 2.2 * dt;
    this.eventHorizonRing.rotation.z += 3.8 * dt;

    // Relativistic photon ring wobble
    this.eventHorizonRing.rotation.x = Math.sin(age * 4.0) * 0.08;
    this.eventHorizonRing.rotation.y = Math.cos(age * 3.5) * 0.08;

    // Shader uniforms
    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // ── Inward Suction Particle Physics (Pulled into Event Horizon) ────────────
    const finalScale = currentScale * envScale;

    // Particles spawned around the rim and violently pulled into the center
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startR = (2.2 + Math.random() * 1.5) * finalScale;
      const px = portalPos.x + Math.cos(angle) * startR;
      const py = portalPos.y + Math.sin(angle) * startR;
      const pz = portalPos.z + (Math.random() - 0.5) * 0.4;

      // Vector toward event horizon
      const toX = portalPos.x - px;
      const toY = portalPos.y - py;
      const dist = Math.sqrt(toX * toX + toY * toY) + 0.01;

      // Inward pull velocity with vortex tangential deflection
      const pullSpeed = 5.8;
      const vx = (toX / dist) * pullSpeed - Math.sin(angle) * 2.5;
      const vy = (toY / dist) * pullSpeed + Math.cos(angle) * 2.5;
      const vz = -1.2; // sinking along Z into wormhole

      particleSystem.emitParticle(
        px, py, pz, vx, vy, vz,
        0.5 + Math.random() * 0.2,
        0.1,
        1.0,
        18 + Math.random() * 6,
        0.75, // dies as it crosses event horizon
        0
      );
    }
  }

  dispose() {
    this.funnelSpiral1.geometry.dispose();
    (this.funnelSpiral1.material as THREE.Material).dispose();

    this.funnelSpiral2.geometry.dispose();
    (this.funnelSpiral2.material as THREE.Material).dispose();

    this.eventHorizonRing.geometry.dispose();
    (this.eventHorizonRing.material as THREE.Material).dispose();

    this.outerPhotonRing.geometry.dispose();
    (this.outerPhotonRing.material as THREE.Material).dispose();

    this.vortexMesh.geometry.dispose();
    (this.vortexMesh.material as THREE.Material).dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
