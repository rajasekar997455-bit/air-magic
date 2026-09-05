import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { CircleCurve, PolygonCurve } from './PortalCurves';

const cyberVortexShader = {
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

    void main() {
      vec2 p = (vUv - vec2(0.5)) * 2.0;
      float r = length(p);
      if (r > 1.0) discard;

      float angle = atan(p.y, p.x);

      // Arc Reactor Singularity Core (Ref Image 2)
      // Rapid spiral with electromagnetic plasma eddies
      float swirl = angle + 4.0 / (r * 1.8 + 0.2) - uTime * 4.0;
      vec2 swirlP = vec2(cos(swirl), sin(swirl)) * r;

      // Digital radial scanlines & concentric laser radar rings
      float scanline = sin(r * 45.0 - uTime * 8.0) * 0.5 + 0.5;
      float spokes = pow(sin(angle * 16.0 + uTime * 2.0) * 0.5 + 0.5, 6.0);

      // High-energy electrical arcing noise
      float electricNoise = noise(swirlP * 12.0 + vec2(uTime * 3.0, -uTime * 4.0));
      float electricArc = pow(electricNoise, 3.5) * 2.8;

      // Blinding white-hot core with electric cyan & ice-blue aura
      float coreGlow = smoothstep(0.45, 0.0, r);
      float centerHotspot = smoothstep(0.18, 0.0, r);

      // 8 Radial power channel beams matching the 8 chevrons
      float chevronBeams = pow(cos(angle * 8.0) * 0.5 + 0.5, 12.0) * smoothstep(0.2, 0.9, r);

      vec3 darkBlue = vec3(0.0, 0.1, 0.25);
      vec3 cyanGlow = vec3(0.0, 0.85, 1.0);
      vec3 whiteHot = vec3(1.0, 1.0, 1.0);

      vec3 col = mix(darkBlue, cyanGlow, scanline * 0.4 + electricArc * 0.6);
      col = mix(col, cyanGlow, chevronBeams * 1.5);
      col += whiteHot * (coreGlow * 1.6 + centerHotspot * 2.5);
      col += cyanGlow * spokes * 0.5;

      float edgeFade = smoothstep(1.0, 0.94, r);
      float finalAlpha = edgeFade * (0.5 + coreGlow * 0.5 + chevronBeams * 0.3) * uAlpha;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export class CyberPortal implements PortalRenderer {
  public readonly type = 'CYBER';
  public readonly group = new THREE.Group();

  // Structural gantry frame (Ref Image 2)
  private gantryGroup = new THREE.Group();
  private chevronGroup = new THREE.Group();
  private chevronLeds: THREE.Mesh[] = [];

  // Inner rotating rune circuit track
  private rotatingTrack = new THREE.Group();
  private statorRing!: THREE.Mesh;
  private circuitRing!: THREE.Mesh;

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
    // 1. Heavy Industrial Structural Octagon Gantry Frame (Dark gunmetal/steel)
    const gantryMat = new THREE.MeshStandardMaterial({
      color: 0x1a222d,
      roughness: 0.4,
      metalness: 0.85,
    });
    const strutGeom = new THREE.BoxGeometry(0.12, 0.12, 1.8);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const strut = new THREE.Mesh(strutGeom, gantryMat);
      strut.position.set(Math.cos(angle) * 2.45, Math.sin(angle) * 2.45, 0.05);
      strut.rotation.z = angle + Math.PI / 2;
      this.gantryGroup.add(strut);
    }
    this.group.add(this.gantryGroup);

    // 2. Heavy Circular Stator Ring Collar
    const statorGeom = new THREE.TorusGeometry(2.15, 0.075, 12, 64);
    const statorMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.3,
      metalness: 0.9,
    });
    this.statorRing = new THREE.Mesh(statorGeom, statorMat);
    this.group.add(this.statorRing);

    // 3. 8 Mechanical Chevron Emitter Power Pylons (Ref Image 2)
    // Traversal blocks locking into the stator ring with bright glowing white/cyan LED arc slots
    const chevronBoxGeom = new THREE.BoxGeometry(0.28, 0.38, 0.25);
    const chevronBodyMat = new THREE.MeshStandardMaterial({
      color: 0x171923,
      roughness: 0.3,
      metalness: 0.95,
    });
    const ledGeom = new THREE.BoxGeometry(0.14, 0.22, 0.27);
    const ledMat = makeTubeMat(0x00ffff, 1.0);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const chevronMesh = new THREE.Group();

      // Outer mechanical clamp
      const body = new THREE.Mesh(chevronBoxGeom, chevronBodyMat);
      chevronMesh.add(body);

      // Embedded glowing LED arc emitter
      const led = new THREE.Mesh(ledGeom, ledMat);
      chevronMesh.add(led);
      this.chevronLeds.push(led);

      chevronMesh.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 2.15, 0.08);
      chevronMesh.rotation.z = angle + Math.PI / 2;
      this.chevronGroup.add(chevronMesh);
    }
    this.group.add(this.chevronGroup);

    // 4. Inner Rotating Precision Circuit Ring (Cyan/White)
    this.rotatingTrack = new THREE.Group();
    const trackGeom1 = new THREE.TubeGeometry(new CircleCurve(1.85), 100, 0.038, 8, true);
    const trackMesh1 = new THREE.Mesh(trackGeom1, makeTubeMat(0x00e5ff, 0.95));
    this.rotatingTrack.add(trackMesh1);

    const trackGeom2 = new THREE.TubeGeometry(new PolygonCurve(8, 1.55, Math.PI / 8), 90, 0.032, 8, true);
    const trackMesh2 = new THREE.Mesh(trackGeom2, makeTubeMat(0xffffff, 0.9));
    this.rotatingTrack.add(trackMesh2);

    const innerCircuitGeom = new THREE.TubeGeometry(new CircleCurve(1.2), 80, 0.025, 8, true);
    this.circuitRing = new THREE.Mesh(innerCircuitGeom, makeTubeMat(0x00aaff, 0.85));
    this.rotatingTrack.add(this.circuitRing);

    this.group.add(this.rotatingTrack);

    // 5. Arc Reactor Singularity Vortex Shader Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: cyberVortexShader.vertexShader,
      fragmentShader: cyberVortexShader.fragmentShader,
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
    this.rotatingTrack.rotation.set(0, 0, 0);
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
    // Mechanical operation: Frame & chevrons stay structurally anchored
    // Inner precision circuit track spins with high RPM
    this.rotatingTrack.rotation.z -= 2.2 * dt;
    this.circuitRing.rotation.z += 1.5 * dt;

    // Periodic chevron power surge (LED pulsing)
    const chevronPulse = 0.7 + Math.sin(age * 12.0) * 0.3;
    for (const led of this.chevronLeds) {
      (led.material as THREE.MeshBasicMaterial).opacity = chevronPulse;
    }

    // Shader uniforms
    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // ── High-Voltage Electrical Discharges & Arc Sparks ────────────────────────
    const finalScale = currentScale * envScale;

    // 1. Electric spark crackle jumping between chevrons
    if (Math.random() < 0.6) {
      const idx = Math.floor(Math.random() * 8);
      const angle = (idx / 8) * Math.PI * 2;
      const r = 2.15 * finalScale;
      const px = portalPos.x + Math.cos(angle) * r;
      const py = portalPos.y + Math.sin(angle) * r;
      const pz = portalPos.z + 0.08 * finalScale;

      // High velocity radial spark
      const speed = 3.5 + Math.random() * 2.0;
      particleSystem.emitParticle(
        px, py, pz,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * 1.5,
        0.7 + Math.random() * 0.3,
        0.95 + Math.random() * 0.05,
        1.0,
        22 + Math.random() * 6,
        0.25, // snappy electric spark
        0
      );
    }

    // 2. Fast rotating circuit ring tangential blue embers
    const emitCount = Math.max(2, Math.floor(5 * finalScale));
    for (let i = 0; i < emitCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.85 * finalScale;
      const px = portalPos.x + Math.cos(a) * r;
      const py = portalPos.y + Math.sin(a) * r;
      const pz = portalPos.z;

      particleSystem.emitParticle(
        px, py, pz,
        -Math.sin(a) * 1.8,
        Math.cos(a) * 1.8,
        0,
        0.0, 0.8, 1.0,
        12, 0.3, 0
      );
    }
  }

  dispose() {
    this.gantryGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    this.statorRing.geometry.dispose();
    (this.statorRing.material as THREE.Material).dispose();

    this.chevronGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    this.rotatingTrack.traverse((obj) => {
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
