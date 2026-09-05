import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalRenderer } from './PortalTypes';
import { makeTubeMat } from './PortalTypes';
import { CircleCurve } from './PortalCurves';

const goldenVortexShader = {
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

      // Living Solar Core & Plasma Corona (Ref Image 4)
      // Convective bubbling noise simulating solar granules
      float sunP = r * 5.0;
      float gran1 = fbm(vec2(cos(angle), sin(angle)) * sunP + vec2(uTime * 0.8, -uTime * 0.6));
      float gran2 = fbm(p * 6.0 - vec2(uTime * 1.2, uTime * 0.9));
      float plasma = mix(gran1, gran2, 0.5);

      // Solar flare prominence rays radiating outward
      float rays = pow(sin(angle * 14.0 + uTime * 4.0 + plasma * 3.0) * 0.5 + 0.5, 4.0);

      // Blazing fusion core: White hot center -> incandescent gold -> amber chromosphere
      float fusionCore = smoothstep(0.42, 0.0, r);
      float innerStar = smoothstep(0.20, 0.0, r);

      // Coronal glow field
      float corona = smoothstep(0.9, 0.35, r);

      vec3 spaceBlack = vec3(0.05, 0.01, 0.0);
      vec3 amberOrange = vec3(1.0, 0.45, 0.05);
      vec3 goldenYellow = vec3(1.0, 0.82, 0.2);
      vec3 whiteHotStar = vec3(1.0, 0.98, 0.88);

      vec3 col = mix(spaceBlack, amberOrange, corona);
      col = mix(col, goldenYellow, plasma * 0.6 + rays * 0.4);
      col += goldenYellow * rays * smoothstep(0.3, 0.9, r) * 1.5;
      col += whiteHotStar * (fusionCore * 1.5 + innerStar * 3.0);

      float edgeFade = smoothstep(1.0, 0.88, r);
      float finalAlpha = edgeFade * (0.5 + fusionCore * 0.5 + corona * 0.4) * uAlpha;

      gl_FragColor = vec4(col, finalAlpha);
    }
  `,
};

export class GoldenPortal implements PortalRenderer {
  public readonly type = 'GOLDEN';
  public readonly group = new THREE.Group();

  // Central miniature star & corona
  private starSphere!: THREE.Mesh;
  private outerCoronaRing!: THREE.Mesh;

  // 3 Prominent 3D Magnetic Prominence Flux Loops (Ref Image 4)
  private loop1Group = new THREE.Group();
  private loop2Group = new THREE.Group();
  private loop3Group = new THREE.Group();

  // Inner vortex shader disc
  private vortexMesh!: THREE.Mesh;
  private vortexUniforms = {
    uTime: { value: 0 },
    uAlpha: { value: 1.0 },
  };

  constructor() {
    this.buildGeometry();
  }

  private buildGeometry() {
    // 1. Central Miniature Fusion Star Core (Ref Image 4)
    const starGeom = new THREE.SphereGeometry(0.45, 32, 32);
    const starMat = makeTubeMat(0xffeebb, 1.0);
    this.starSphere = new THREE.Mesh(starGeom, starMat);
    this.starSphere.position.z = -0.1;
    this.group.add(this.starSphere);

    // 2. Outer Blazing Coronal Ring
    const coronaGeom = new THREE.TubeGeometry(new CircleCurve(2.1), 120, 0.06, 10, true);
    this.outerCoronaRing = new THREE.Mesh(coronaGeom, makeTubeMat(0xff8800, 0.95));
    this.group.add(this.outerCoronaRing);

    // 3. 3D Magnetic Prominence Flux Loop 1 (Tilted 45° X, 20° Y)
    this.loop1Group = new THREE.Group();
    this.loop1Group.rotation.x = Math.PI * 0.25;
    this.loop1Group.rotation.y = Math.PI * 0.12;
    const loop1Geom = new THREE.TorusGeometry(1.85, 0.048, 12, 64, Math.PI * 1.8);
    const loop1Mesh = new THREE.Mesh(loop1Geom, makeTubeMat(0xffaa11, 0.95));
    this.loop1Group.add(loop1Mesh);
    this.group.add(this.loop1Group);

    // 4. 3D Magnetic Prominence Flux Loop 2 (Tilted -55° X, 50° Y)
    this.loop2Group = new THREE.Group();
    this.loop2Group.rotation.x = -Math.PI * 0.3;
    this.loop2Group.rotation.y = Math.PI * 0.28;
    const loop2Geom = new THREE.TorusGeometry(1.65, 0.042, 12, 64, Math.PI * 1.7);
    const loop2Mesh = new THREE.Mesh(loop2Geom, makeTubeMat(0xff7700, 0.95));
    this.loop2Group.add(loop2Mesh);
    this.group.add(this.loop2Group);

    // 5. 3D Magnetic Prominence Flux Loop 3 (Tilted 70° Y, -35° Z)
    this.loop3Group = new THREE.Group();
    this.loop3Group.rotation.y = Math.PI * 0.38;
    this.loop3Group.rotation.z = -Math.PI * 0.2;
    const loop3Geom = new THREE.TorusGeometry(1.45, 0.038, 12, 64, Math.PI * 1.6);
    const loop3Mesh = new THREE.Mesh(loop3Geom, makeTubeMat(0xffcc22, 0.9));
    this.loop3Group.add(loop3Mesh);
    this.group.add(this.loop3Group);

    // 6. Solar Plasma Vortex Shader Disc
    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: goldenVortexShader.vertexShader,
      fragmentShader: goldenVortexShader.fragmentShader,
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
    this.outerCoronaRing.rotation.set(0, 0, 0);
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
    // Outer corona rotation
    this.outerCoronaRing.rotation.z += 2.2 * dt;

    // Asynchronous 3D rotations of magnetic prominence flux loops (Solar dynamo simulation)
    this.loop1Group.rotation.z += 1.8 * dt;
    this.loop1Group.rotation.x += 0.5 * dt;

    this.loop2Group.rotation.z -= 2.2 * dt;
    this.loop2Group.rotation.y += 0.4 * dt;

    this.loop3Group.rotation.z += 2.8 * dt;
    this.loop3Group.rotation.y -= 0.6 * dt;

    // Central star fusion breathing pulse
    const pulse = 1.0 + Math.sin(age * 6.0) * 0.08;
    this.starSphere.scale.set(pulse, pulse, pulse);

    // Shader uniforms
    this.vortexUniforms.uTime.value = age;
    this.vortexUniforms.uAlpha.value = envScale;

    // ── Solar Flares & Coronal Mass Ejection Particle Physics ─────────────────
    const finalScale = currentScale * envScale;
    const emitCount = Math.max(3, Math.floor(9 * finalScale));

    // 1. Golden solar wind and plasma embers leaping out along magnetic loops
    for (let i = 0; i < emitCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = (1.2 + Math.random() * 0.9) * finalScale;
      const px = portalPos.x + Math.cos(a) * r;
      const py = portalPos.y + Math.sin(a) * r;
      const pz = portalPos.z + (Math.random() - 0.5) * 0.4;

      // Radial blast outward
      const speed = 1.5 + Math.random() * 2.0;
      const vx = Math.cos(a) * speed + (Math.random() - 0.5) * 0.4;
      const vy = Math.sin(a) * speed + (Math.random() - 0.5) * 0.4;
      const vz = (Math.random() - 0.5) * 0.8;

      particleSystem.emitParticle(
        px, py, pz, vx, vy, vz,
        1.0,
        0.55 + Math.random() * 0.35,
        0.05 + Math.random() * 0.15,
        16 + Math.random() * 6,
        0.45,
        0
      );
    }

    // 2. High-intensity solar flare burst from central star
    if (Math.random() < 0.35) {
      const flareAngle = Math.random() * Math.PI * 2;
      const vx = Math.cos(flareAngle) * 4.2;
      const vy = Math.sin(flareAngle) * 4.2;
      particleSystem.emitParticle(
        portalPos.x, portalPos.y, portalPos.z,
        vx, vy, (Math.random() - 0.5) * 1.5,
        1.0, 0.92, 0.5,
        24, 0.35, 0
      );
    }
  }

  dispose() {
    this.starSphere.geometry.dispose();
    (this.starSphere.material as THREE.Material).dispose();

    this.outerCoronaRing.geometry.dispose();
    (this.outerCoronaRing.material as THREE.Material).dispose();

    this.loop1Group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    this.loop2Group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    this.loop3Group.traverse((obj) => {
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
