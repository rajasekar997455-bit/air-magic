import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { RoseCurve, CircleCurve } from './PortalCurves';

// Protected Legacy Nature Vortex Shader (Exact preservation)
const natureVortexShader = {
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
      float swirlStrength = 4.5;
      float swirlAngle = angle + swirlStrength / (r * 1.8 + 0.22) - uTime * 2.2;
      vec2 swirlP = vec2(cos(swirlAngle), sin(swirlAngle)) * r;

      float n1 = fbm(swirlP * 3.5 + vec2(uTime * 0.4, -uTime * 0.3));
      float n2 = fbm(swirlP * 6.0 - vec2(uTime * 0.7, uTime * 0.5));
      float energyPattern = mix(n1, n2, 0.5);

      float armCount = 4.0;
      float arms = sin(swirlAngle * armCount + r * 5.0) * 0.5 + 0.5;
      arms = pow(arms, 2.5);

      float singularityRadius = 0.20;
      float singularity = smoothstep(singularityRadius * 0.7, singularityRadius, r);
      float accretionDisk = smoothstep(singularityRadius * 0.85, singularityRadius * 1.15, r) *
                            (1.0 - smoothstep(singularityRadius * 1.15, singularityRadius * 2.2, r));

      vec3 uSingularityColor = vec3(0.01, 0.06, 0.02);
      vec3 uColorCore = vec3(0.15, 0.75, 0.25);
      vec3 uColorGlow = vec3(0.6, 1.0, 0.3);

      vec3 color = mix(uSingularityColor, uColorCore, singularity);
      color = mix(color, uColorGlow, (arms * 0.6 + energyPattern * 0.4));
      color += uColorGlow * accretionDisk * 1.8;

      float edgeFade = smoothstep(1.0, 0.93, r);
      float coreAlpha = smoothstep(0.02, singularityRadius * 0.6, r) * 0.75 + 0.35;
      float finalAlpha = edgeFade * coreAlpha * uAlpha;

      gl_FragColor = vec4(color, finalAlpha);
    }
  `,
};

export class NaturePortal implements PortalRenderer {
  public readonly type = 'NATURE';
  public readonly group = new THREE.Group();

  private ring1!: THREE.Mesh;
  private ring2!: THREE.Mesh;
  private ring3!: THREE.Mesh;
  private primaryCurve = new RoseCurve(5, 2.1);

  private vortexMesh!: THREE.Mesh;
  private vortexUniforms = {
    uTime: { value: 0 },
    uAlpha: { value: 1.0 },
  };

  constructor() {
    this.buildGeometry();
  }

  private buildGeometry() {
    // Exact preserved Nature rings
    // 1. 5-petal botanical rose curve
    const geom1 = new THREE.TubeGeometry(new RoseCurve(5, 2.1), 240, 0.05, 8, true);
    this.ring1 = new THREE.Mesh(geom1, makeTubeMat(0x22cc55));
    this.ring1.position.z = 0;
    this.group.add(this.ring1);

    // 2. Middle circle curve
    const geom2 = new THREE.TubeGeometry(new CircleCurve(1.55), 90, 0.038, 8, true);
    this.ring2 = new THREE.Mesh(geom2, makeTubeMat(0x00aa44));
    this.ring2.position.z = -0.1;
    this.group.add(this.ring2);

    // 3. Inner 3-petal rose curve
    const geom3 = new THREE.TubeGeometry(new RoseCurve(3, 1.05), 160, 0.028, 8, true);
    this.ring3 = new THREE.Mesh(geom3, makeTubeMat(0x88ff44));
    this.ring3.position.z = -0.2;
    this.group.add(this.ring3);

    // 4. Exact preserved Nature Vortex Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: natureVortexShader.vertexShader,
      fragmentShader: natureVortexShader.fragmentShader,
      uniforms: this.vortexUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.vortexMesh = new THREE.Mesh(new THREE.CircleGeometry(2.05, 64), vortexMat);
    this.vortexMesh.position.z = -0.32;
    this.group.add(this.vortexMesh);
  }

  activate(_scale: number) {
    this.ring1.rotation.set(0, 0, 0);
    this.ring2.rotation.set(0, 0, 0);
    this.ring3.rotation.set(0, 0, 0);
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
    // Exact preserved rotation physics
    this.ring1.rotation.z += 0.9 * dt;
    this.ring1.rotation.x += 0.9 * 0.35 * dt;

    this.ring2.rotation.z -= 1.4 * dt;
    this.ring2.rotation.x -= 1.4 * 0.35 * dt;

    this.ring3.rotation.z += 2.2 * dt;
    this.ring3.rotation.x += 2.2 * 0.35 * dt;

    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // Exact preserved tangential particles
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(2, Math.floor(7 * finalScale));
    const primaryRotation = this.ring1.rotation.z;
    const cosR = Math.cos(primaryRotation);
    const sinR = Math.sin(primaryRotation);

    for (let i = 0; i < emitCount; i++) {
      const t = Math.random();
      const localPt = this.primaryCurve.getPoint(t);
      const tangent = this.primaryCurve.getTangent(t);

      const rotX = localPt.x * cosR - localPt.y * sinR;
      const rotY = localPt.x * sinR + localPt.y * cosR;

      const px = portalPos.x + rotX * finalScale;
      const py = portalPos.y + rotY * finalScale;
      const pz = portalPos.z + localPt.z * finalScale + (Math.random() - 0.5) * 0.05;

      const tanX = tangent.x * cosR - tangent.y * sinR;
      const tanY = tangent.x * sinR + tangent.y * cosR;

      const speed = 0.9 + Math.random() * 0.7;
      const vx = tanX * speed + (Math.random() - 0.5) * 0.15;
      const vy = tanY * speed + (Math.random() - 0.5) * 0.15;
      const vz = (Math.random() - 0.5) * 0.2;

      particleSystem.emitParticle(
        px, py, pz, vx, vy, vz,
        0.25 * (0.85 + Math.random() * 0.3),
        0.95 * (0.85 + Math.random() * 0.3),
        0.35 * (0.85 + Math.random() * 0.3),
        11 + Math.random() * 5,
        0.35,
        0
      );
    }

    // Upward drifting magical spores (exact preserved)
    if (Math.random() < 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const r = (0.5 + Math.random() * 1.2) * finalScale;
      particleSystem.emitParticle(
        portalPos.x + Math.cos(angle) * r,
        portalPos.y + Math.sin(angle) * r,
        portalPos.z,
        (Math.random() - 0.5) * 0.5,
        0.8 + Math.random() * 1.5,
        (Math.random() - 0.5) * 0.4,
        0.2 + Math.random() * 0.3,
        0.9 + Math.random() * 0.1,
        0.15,
        20, 2.2, 0
      );
    }
  }

  dispose() {
    this.ring1.geometry.dispose();
    (this.ring1.material as THREE.Material).dispose();

    this.ring2.geometry.dispose();
    (this.ring2.material as THREE.Material).dispose();

    this.ring3.geometry.dispose();
    (this.ring3.material as THREE.Material).dispose();

    this.vortexMesh.geometry.dispose();
    (this.vortexMesh.material as THREE.Material).dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
