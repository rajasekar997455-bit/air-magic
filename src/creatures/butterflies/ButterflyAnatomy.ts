import * as THREE from 'three';

/**
 * Procedural 3D Butterfly Anatomy Builder
 * 
 * Constructs an authentic, biologically-proportioned butterfly model:
 * - Broad, planar forewings and hindwings oriented in the horizontal XZ plane
 *   (Flapping rotates on Z for true dorsal/ventral wingbeats)
 * - Sculpted leading edges, apical curves, and scalloped margin lobes
 * - Muscular aerodynamic thorax, segmented abdomen, head, compound eyes, and curved antennae
 */

export interface ButterflyMeshes {
  rootGroup: THREE.Group;
  bodyGroup: THREE.Group;
  abdomenMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  proboscisGroup: THREE.Group;
  proboscisMesh: THREE.Mesh;
  leftAntenna: THREE.Mesh;
  rightAntenna: THREE.Mesh;
  leftForewingGroup: THREE.Group;
  rightForewingGroup: THREE.Group;
  leftHindwingGroup: THREE.Group;
  rightHindwingGroup: THREE.Group;
  leftForewingMesh: THREE.Mesh;
  rightForewingMesh: THREE.Mesh;
  leftHindwingMesh: THREE.Mesh;
  rightHindwingMesh: THREE.Mesh;
  wingMeshes: THREE.Mesh[];
  bodyMeshes: THREE.Mesh[];
}

/**
 * Builds a broad, planar forewing geometry (upper wing).
 * Oriented in XZ plane (X = lateral span, Z = longitudinal chord, Y = camber).
 */
export function buildForewingGeometry(isRight: boolean): THREE.BufferGeometry {
  const widthSegments = 14;
  const heightSegments = 14;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sign = isRight ? 1 : -1;
  const span = 1.35;   // wing length along lateral X axis
  const chord = 0.95;  // wing width along longitudinal Z axis

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments; // 0 (base at thorax) to 1 (apex/wingtip)
    for (let i = 0; i <= widthSegments; i++) {
      const u = i / widthSegments; // 0 (trailing margin) to 1 (leading edge)

      // Leading edge arches forward as it sweeps outward
      const leadingEdgeSweep = Math.sin(v * Math.PI * 0.5) * 0.35;
      const taper = 0.25 + 0.75 * Math.sin(v * Math.PI * 0.75);

      // Scalloped tooth notches along outer trailing edge (u near 0)
      const scallop = (1.0 - u) * Math.sin(v * Math.PI * 5.0) * 0.025 * v;

      // X: lateral span outwards from thorax hinge
      const x = sign * v * span;
      // Z: chord position (+Z is forward/head, -Z is backward/tail)
      const z = (u - 0.35) * chord * taper + leadingEdgeSweep + scallop;
      // Y: delicate aerofoil camber (thin planar membrane with gentle curve)
      const y = Math.sin(u * Math.PI) * 0.025 * (1.0 - v * 0.3) - Math.sin(v * Math.PI) * 0.015;

      positions.push(x, y, z);
      // UV: u maps chord (0 to 1), v maps span (0 to 1)
      uvs.push(isRight ? v : 1.0 - v, u);
    }
  }

  // Create triangles
  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < widthSegments; i++) {
      const a = j * (widthSegments + 1) + i;
      const b = j * (widthSegments + 1) + i + 1;
      const c = (j + 1) * (widthSegments + 1) + i + 1;
      const d = (j + 1) * (widthSegments + 1) + i;

      if (isRight) {
        indices.push(a, b, c);
        indices.push(a, c, d);
      } else {
        indices.push(a, c, b);
        indices.push(a, d, c);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds a broad, planar hindwing geometry (lower wing).
 * Oriented in XZ plane with rounded scalloped trailing lobes.
 */
export function buildHindwingGeometry(isRight: boolean): THREE.BufferGeometry {
  const widthSegments = 12;
  const heightSegments = 12;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sign = isRight ? 1 : -1;
  const span = 0.95;
  const chord = 0.85;

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments; // 0 (base) to 1 (outer rim)
    for (let i = 0; i <= widthSegments; i++) {
      const u = i / widthSegments; // 0 to 1

      // Rounded sub-oval silhouette with delicate scalloped rim and swallowtail lobe
      const scallop = Math.sin(u * Math.PI * 4.0) * 0.025 * v;
      const shape = Math.sin(v * Math.PI * 0.85) * (0.35 + 0.65 * Math.sin(u * Math.PI));

      const x = sign * v * span;
      const z = -(u * chord * (0.4 + 0.6 * shape)) + scallop;
      const y = -Math.sin(u * Math.PI) * 0.02 * (1.0 - v * 0.4);

      positions.push(x, y, z);
      uvs.push(isRight ? v : 1.0 - v, u);
    }
  }

  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < widthSegments; i++) {
      const a = j * (widthSegments + 1) + i;
      const b = j * (widthSegments + 1) + i + 1;
      const c = (j + 1) * (widthSegments + 1) + i + 1;
      const d = (j + 1) * (widthSegments + 1) + i;

      if (isRight) {
        indices.push(a, b, c);
        indices.push(a, c, d);
      } else {
        indices.push(a, c, b);
        indices.push(a, d, c);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates an antenna curve with an arched sweep and clubbed tip
 */
class AntennaCurve extends THREE.Curve<THREE.Vector3> {
  private isRight: boolean;
  constructor(isRight: boolean) {
    super();
    this.isRight = isRight;
  }
  getPoint(t: number): THREE.Vector3 {
    const sign = this.isRight ? 1 : -1;
    // Arches forward (+Z), lateral (+/- X), and upward (+Y)
    const x = sign * (0.02 + Math.pow(t, 1.4) * 0.22);
    const y = t * 0.22 + Math.sin(t * Math.PI * 0.6) * 0.08;
    const z = t * 0.35 + Math.sin(t * Math.PI * 0.5) * 0.05;
    return new THREE.Vector3(x, y, z);
  }
}

/**
 * Assembles a complete, biologically-accurate 3D Butterfly hierarchy
 */
export function createButterflyModel(
  bodyMaterial: THREE.Material,
  forewingMaterial: THREE.Material,
  hindwingMaterial: THREE.Material
): ButterflyMeshes {
  const rootGroup = new THREE.Group();
  const bodyGroup = new THREE.Group();
  rootGroup.add(bodyGroup);

  const bodyMeshes: THREE.Mesh[] = [];
  const wingMeshes: THREE.Mesh[] = [];

  // 1. Thorax (Central muscular core)
  const thoraxGeom = new THREE.CylinderGeometry(0.045, 0.06, 0.26, 12);
  thoraxGeom.rotateX(Math.PI * 0.5); // Lay along Z axis
  const thoraxMesh = new THREE.Mesh(thoraxGeom, bodyMaterial);
  thoraxMesh.position.set(0, 0, 0);
  bodyGroup.add(thoraxMesh);
  bodyMeshes.push(thoraxMesh);

  // 2. Head & Compound Eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.02, 0.16);
  const headGeom = new THREE.SphereGeometry(0.055, 12, 10);
  headGeom.scale(0.85, 0.85, 1.05);
  const headMesh = new THREE.Mesh(headGeom, bodyMaterial);
  headGroup.add(headMesh);
  bodyMeshes.push(headMesh);

  // Compound Eye Spheres
  const eyeGeom = new THREE.SphereGeometry(0.028, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeom, bodyMaterial);
  leftEye.position.set(-0.038, 0.015, 0.02);
  const rightEye = new THREE.Mesh(eyeGeom, bodyMaterial);
  rightEye.position.set(0.038, 0.015, 0.02);
  headGroup.add(leftEye, rightEye);
  bodyMeshes.push(leftEye, rightEye);

  // Antennae
  const leftAntennaGeom = new THREE.TubeGeometry(new AntennaCurve(false), 20, 0.005, 6, false);
  const leftAntenna = new THREE.Mesh(leftAntennaGeom, bodyMaterial);
  leftAntenna.position.set(0, 0.02, 0.03);
  const rightAntennaGeom = new THREE.TubeGeometry(new AntennaCurve(true), 20, 0.005, 6, false);
  const rightAntenna = new THREE.Mesh(rightAntennaGeom, bodyMaterial);
  rightAntenna.position.set(0, 0.02, 0.03);
  headGroup.add(leftAntenna, rightAntenna);
  bodyMeshes.push(leftAntenna, rightAntenna);

  // Antenna Tip Bulbs
  const tipGeom = new THREE.SphereGeometry(0.010, 6, 6);
  const leftTip = new THREE.Mesh(tipGeom, bodyMaterial);
  leftTip.position.copy(new AntennaCurve(false).getPoint(1.0)).add(new THREE.Vector3(0, 0.02, 0.03));
  const rightTip = new THREE.Mesh(tipGeom, bodyMaterial);
  rightTip.position.copy(new AntennaCurve(true).getPoint(1.0)).add(new THREE.Vector3(0, 0.02, 0.03));
  headGroup.add(leftTip, rightTip);
  bodyMeshes.push(leftTip, rightTip);

  // Proboscis (Coiled feeding tube)
  const proboscisGroup = new THREE.Group();
  proboscisGroup.position.set(0, -0.025, 0.045);
  const probCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.04, 0.03),
    new THREE.Vector3(0, -0.08, 0.08),
    new THREE.Vector3(0, -0.14, 0.12)
  );
  const probGeom = new THREE.TubeGeometry(probCurve, 16, 0.004, 6, false);
  const proboscisMesh = new THREE.Mesh(probGeom, bodyMaterial);
  proboscisGroup.add(proboscisMesh);
  // Initially coiled/retracted
  proboscisGroup.scale.set(0.35, 0.35, 0.35);
  proboscisGroup.rotation.x = -0.6;
  headGroup.add(proboscisGroup);
  bodyMeshes.push(proboscisMesh);

  bodyGroup.add(headGroup);

  // 3. Abdomen (Segmented, tapered, natural downward droop)
  const abdomenGeom = new THREE.ConeGeometry(0.055, 0.44, 12, 6);
  abdomenGeom.rotateX(-Math.PI * 0.5); // Points backward
  const abdomenMesh = new THREE.Mesh(abdomenGeom, bodyMaterial);
  abdomenMesh.position.set(0, -0.03, -0.30);
  abdomenMesh.rotation.x = -0.12; // Natural lepidopteran abdominal droop
  bodyGroup.add(abdomenMesh);
  bodyMeshes.push(abdomenMesh);

  // 4. Four Anatomical Wings with Dedicated Hinge Pivots
  // Left Forewing (Mesothoracic Hinge)
  const leftForewingGroup = new THREE.Group();
  leftForewingGroup.position.set(-0.045, 0.035, 0.04);
  const leftForewingMesh = new THREE.Mesh(buildForewingGeometry(false), forewingMaterial);
  leftForewingGroup.add(leftForewingMesh);
  bodyGroup.add(leftForewingGroup);

  // Right Forewing (Mesothoracic Hinge)
  const rightForewingGroup = new THREE.Group();
  rightForewingGroup.position.set(0.045, 0.035, 0.04);
  const rightForewingMesh = new THREE.Mesh(buildForewingGeometry(true), forewingMaterial);
  rightForewingGroup.add(rightForewingMesh);
  bodyGroup.add(rightForewingGroup);

  // Left Hindwing (Metathoracic Hinge, slightly posterior)
  const leftHindwingGroup = new THREE.Group();
  leftHindwingGroup.position.set(-0.035, 0.015, -0.05);
  const leftHindwingMesh = new THREE.Mesh(buildHindwingGeometry(false), hindwingMaterial);
  leftHindwingGroup.add(leftHindwingMesh);
  bodyGroup.add(leftHindwingGroup);

  // Right Hindwing (Metathoracic Hinge)
  const rightHindwingGroup = new THREE.Group();
  rightHindwingGroup.position.set(0.035, 0.015, -0.05);
  const rightHindwingMesh = new THREE.Mesh(buildHindwingGeometry(true), hindwingMaterial);
  rightHindwingGroup.add(rightHindwingMesh);
  bodyGroup.add(rightHindwingGroup);

  wingMeshes.push(leftForewingMesh, rightForewingMesh, leftHindwingMesh, rightHindwingMesh);

  return {
    rootGroup,
    bodyGroup,
    abdomenMesh,
    headMesh,
    proboscisGroup,
    proboscisMesh,
    leftAntenna,
    rightAntenna,
    leftForewingGroup,
    rightForewingGroup,
    leftHindwingGroup,
    rightHindwingGroup,
    leftForewingMesh,
    rightForewingMesh,
    leftHindwingMesh,
    rightHindwingMesh,
    wingMeshes,
    bodyMeshes,
  };
}
