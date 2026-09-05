import * as THREE from 'three';

/**
 * Botanical 3D Flower Anatomy Builder — Complete Living Plant
 * 
 * Constructs a fully rooted, botanically authentic flowering plant:
 * - Multi-tiered organic petals (inner, middle, outer whorls) in Fibonacci distribution
 * - Spoon-shaped 3D curvature, realistic base-to-tip tapering, and natural thickness
 * - Central reproductive receptacle with stamens, anthers, pistil, and nectar reservoir
 * - Tall, curved botanical stem with calyx sepals cradling the flower head
 * - Broad foliage leaves with natural midrib camber sprouting from stem nodes
 * - Complete spreading 3D root system (taproot & fibrous root tendrils spreading into ground)
 * - Dedicated perching slots on petals for butterflies with surface normals
 */

export interface PetalInstance {
  group: THREE.Group;
  mesh: THREE.Mesh;
  whorl: 'INNER' | 'MIDDLE' | 'OUTER';
  baseAngle: number;
  openDelay: number;
  maxOpenAngle: number;
  currentOpenAngle: number;
  openVelocity: number;
  length: number;
}

export interface PerchSlot {
  slotIndex: number;
  petalIndex: number;
  worldPosition: THREE.Vector3;
  surfaceNormal: THREE.Vector3;
  headingTangent: THREE.Vector3;
  isOccupied: boolean;
  occupantId: number | null;
}

export interface FlowerMeshes {
  rootGroup: THREE.Group;
  stemMesh: THREE.Mesh;
  sepalMeshes: THREE.Mesh[];
  leafMeshes: THREE.Mesh[];
  rootTendrils: THREE.Mesh[];
  receptacleMesh: THREE.Mesh;
  nectarMesh: THREE.Mesh;
  stamenMeshes: THREE.Mesh[];
  petals: PetalInstance[];
  perchSlots: PerchSlot[];
}

/**
 * Builds a sculpted 3D petal geometry with spoon-dish camber and delicate tip
 */
export function buildPetalGeometry(length: number, width: number): THREE.BufferGeometry {
  const widthSegments = 10;
  const heightSegments = 14;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments; // 0 (base at receptacle) to 1 (tip)
    for (let i = 0; i <= widthSegments; i++) {
      const u = i / widthSegments; // 0 to 1 across width

      const widthProfile = Math.sin(v * Math.PI * 0.9) * (0.3 + 0.7 * Math.sin(Math.min(1.0, v * 1.5) * Math.PI * 0.5));
      const x = (u - 0.5) * width * widthProfile;

      const longitudinalArc = Math.pow(v, 1.4) * length;
      const z = longitudinalArc;

      const bowlCamber = -Math.sin(u * Math.PI) * (width * 0.28) * Math.sin(v * Math.PI * 0.85);
      const tipFlute = Math.sin(u * Math.PI * 3.0) * 0.008 * (1.0 - v);
      const y = bowlCamber + tipFlute;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < widthSegments; i++) {
      const a = j * (widthSegments + 1) + i;
      const b = j * (widthSegments + 1) + i + 1;
      const c = (j + 1) * (widthSegments + 1) + i + 1;
      const d = (j + 1) * (widthSegments + 1) + i;

      indices.push(a, b, c);
      indices.push(a, c, d);
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
 * Builds a broad botanical leaf geometry with natural central midrib and downward droop
 */
export function buildLeafGeometry(length: number, width: number): THREE.BufferGeometry {
  const widthSegments = 8;
  const heightSegments = 12;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments; // 0 (stalk) to 1 (tip)
    for (let i = 0; i <= widthSegments; i++) {
      const u = i / widthSegments;

      const widthProfile = Math.sin(v * Math.PI) * (0.2 + 0.8 * Math.sin(Math.min(1.0, v * 1.8) * Math.PI * 0.5));
      const x = (u - 0.5) * width * widthProfile;
      const z = Math.pow(v, 1.2) * length;

      // V-shaped leaf midrib trough + natural longitudinal droop
      const midribFold = -Math.abs(u - 0.5) * (width * 0.3) * Math.sin(v * Math.PI);
      const longitudinalDroop = -Math.pow(v, 2.2) * 0.18;
      const y = midribFold + longitudinalDroop;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < widthSegments; i++) {
      const a = j * (widthSegments + 1) + i;
      const b = j * (widthSegments + 1) + i + 1;
      const c = (j + 1) * (widthSegments + 1) + i + 1;
      const d = (j + 1) * (widthSegments + 1) + i;

      indices.push(a, b, c);
      indices.push(a, c, d);
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
 * Creates the complete botanical flowering plant (flower head + sepals + stem + leaves + roots)
 */
export function createFlowerModel(
  petalMaterial: THREE.Material,
  receptacleMaterial: THREE.Material,
  nectarMaterial: THREE.Material,
  stemMaterial: THREE.Material
): FlowerMeshes {
  const rootGroup = new THREE.Group();
  const sepalMeshes: THREE.Mesh[] = [];
  const leafMeshes: THREE.Mesh[] = [];
  const rootTendrils: THREE.Mesh[] = [];

  // ── 1. Curved Botanical Stem ──
  // Natural organic S-curve descending from receptacle (y=0) to ground (y=-1.35)
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(0.04, -0.25, 0.02),
    new THREE.Vector3(-0.03, -0.65, -0.02),
    new THREE.Vector3(0.02, -1.05, 0.01),
    new THREE.Vector3(0, -1.35, 0),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 28, 0.032, 10, false);
  const stemMesh = new THREE.Mesh(stemGeom, stemMaterial);
  rootGroup.add(stemMesh);

  // ── 2. Calyx Sepals (Green protective cups under the petals) ──
  const sepalCount = 5;
  for (let i = 0; i < sepalCount; i++) {
    const angle = (i / sepalCount) * Math.PI * 2;
    const sepalGeom = buildLeafGeometry(0.35, 0.16);
    const sepalMesh = new THREE.Mesh(sepalGeom, stemMaterial);
    sepalMesh.position.set(Math.cos(angle) * 0.06, -0.04, Math.sin(angle) * 0.06);
    sepalMesh.rotation.y = -angle + Math.PI * 0.5;
    sepalMesh.rotation.x = 0.65; // Curves outward to cup the petals
    rootGroup.add(sepalMesh);
    sepalMeshes.push(sepalMesh);
  }

  // ── 3. Foliage Leaves Sprouting from Stem Nodes ──
  // Node 1 (Mid-stem)
  const leaf1Geom = buildLeafGeometry(0.85, 0.38);
  const leaf1 = new THREE.Mesh(leaf1Geom, stemMaterial);
  leaf1.position.set(0.04, -0.45, 0.02);
  leaf1.rotation.y = 0.6;
  leaf1.rotation.x = 0.85; // Arching outward
  leaf1.rotation.z = -0.3;
  rootGroup.add(leaf1);
  leafMeshes.push(leaf1);

  // Node 2 (Lower stem, opposite side)
  const leaf2Geom = buildLeafGeometry(0.95, 0.42);
  const leaf2 = new THREE.Mesh(leaf2Geom, stemMaterial);
  leaf2.position.set(-0.03, -0.85, -0.02);
  leaf2.rotation.y = -2.4;
  leaf2.rotation.x = 0.82;
  leaf2.rotation.z = 0.35;
  rootGroup.add(leaf2);
  leafMeshes.push(leaf2);

  // ── 4. Full Spreading Organic Root System ──
  // Primary central taproot descending deeper into ground
  const taprootCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -1.35, 0),
    new THREE.Vector3(0.02, -1.50, -0.02),
    new THREE.Vector3(-0.02, -1.65, 0.01),
    new THREE.Vector3(0, -1.85, 0)
  );
  const taprootGeom = new THREE.TubeGeometry(taprootCurve, 16, 0.028, 8, false);
  const taprootMesh = new THREE.Mesh(taprootGeom, stemMaterial);
  rootGroup.add(taprootMesh);
  rootTendrils.push(taprootMesh);

  // 8 Spreading fibrous lateral roots branching outward across the 3D ground plane
  const rootCount = 8;
  for (let i = 0; i < rootCount; i++) {
    const angle = (i / rootCount) * Math.PI * 2 + (i % 2) * 0.18;
    const r = 0.45 + (i % 3) * 0.22; // 0.45m to 0.9m root spread
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, -1.35, 0),
      new THREE.Vector3(Math.cos(angle) * r * 0.35, -1.42, Math.sin(angle) * r * 0.35),
      new THREE.Vector3(Math.cos(angle) * r * 0.75, -1.52 - (i % 2) * 0.08, Math.sin(angle) * r * 0.75),
      new THREE.Vector3(Math.cos(angle) * r, -1.60, Math.sin(angle) * r)
    );
    const rootGeom = new THREE.TubeGeometry(curve, 14, 0.018 * (1.0 - (i % 2) * 0.25), 6, false);
    const rootMesh = new THREE.Mesh(rootGeom, stemMaterial);
    rootGroup.add(rootMesh);
    rootTendrils.push(rootMesh);
  }

  // ── 5. Central Floral Receptacle (Domed base) ──
  const receptacleGeom = new THREE.SphereGeometry(0.22, 16, 12);
  receptacleGeom.scale(1.0, 0.55, 1.0);
  const receptacleMesh = new THREE.Mesh(receptacleGeom, receptacleMaterial);
  receptacleMesh.position.set(0, 0.02, 0);
  rootGroup.add(receptacleMesh);

  // ── 6. Central Glowing Nectar Reservoir ──
  const nectarGeom = new THREE.SphereGeometry(0.12, 16, 14);
  nectarGeom.scale(1.0, 0.45, 1.0);
  const nectarMesh = new THREE.Mesh(nectarGeom, nectarMaterial);
  nectarMesh.position.set(0, 0.08, 0);
  rootGroup.add(nectarMesh);

  // ── 7. Stamen Cluster ──
  const stamenMeshes: THREE.Mesh[] = [];
  const stamenCount = 20;
  for (let i = 0; i < stamenCount; i++) {
    const angle = (i / stamenCount) * Math.PI * 2 + (i % 2) * 0.15;
    const r = 0.08 + (i % 3) * 0.035;

    const stamenGroup = new THREE.Group();
    stamenGroup.position.set(Math.cos(angle) * r, 0.06, Math.sin(angle) * r);
    stamenGroup.rotation.y = angle;
    stamenGroup.rotation.z = -0.22 - (i % 3) * 0.08;

    const stalkGeom = new THREE.CylinderGeometry(0.005, 0.007, 0.16, 6);
    stalkGeom.translate(0, 0.08, 0);
    const stalkMesh = new THREE.Mesh(stalkGeom, receptacleMaterial);
    stamenGroup.add(stalkMesh);

    const antherGeom = new THREE.SphereGeometry(0.016, 8, 6);
    antherGeom.scale(1.5, 0.8, 1.0);
    antherGeom.translate(0, 0.16, 0);
    const antherMesh = new THREE.Mesh(antherGeom, nectarMaterial);
    stamenGroup.add(antherMesh);

    rootGroup.add(stamenGroup);
    stamenMeshes.push(stalkMesh, antherMesh);
  }

  // ── 8. Multi-Tiered Petal Whorls ──
  const petals: PetalInstance[] = [];
  const whorlConfigs: Array<{
    whorl: 'INNER' | 'MIDDLE' | 'OUTER';
    count: number;
    length: number;
    width: number;
    radius: number;
    angleOffset: number;
    maxOpenAngle: number;
    openDelay: number;
  }> = [
    {
      whorl: 'INNER',
      count: 5,
      length: 0.65,
      width: 0.40,
      radius: 0.12,
      angleOffset: 0,
      maxOpenAngle: 0.85,
      openDelay: 0.35,
    },
    {
      whorl: 'MIDDLE',
      count: 6,
      length: 0.85,
      width: 0.48,
      radius: 0.16,
      angleOffset: Math.PI / 6,
      maxOpenAngle: 1.15,
      openDelay: 0.18,
    },
    {
      whorl: 'OUTER',
      count: 8,
      length: 1.05,
      width: 0.55,
      radius: 0.20,
      angleOffset: Math.PI / 8,
      maxOpenAngle: 1.38,
      openDelay: 0.0,
    },
  ];

  for (const cfg of whorlConfigs) {
    const geom = buildPetalGeometry(cfg.length, cfg.width);

    for (let i = 0; i < cfg.count; i++) {
      const baseAngle = (i / cfg.count) * Math.PI * 2 + cfg.angleOffset + (i % 2) * 0.04;
      const petalGroup = new THREE.Group();

      petalGroup.position.set(
        Math.cos(baseAngle) * cfg.radius,
        0.02 + (cfg.whorl === 'INNER' ? 0.03 : 0),
        Math.sin(baseAngle) * cfg.radius
      );

      petalGroup.rotation.y = -baseAngle + Math.PI * 0.5;
      petalGroup.rotation.x = 0.08;

      const petalMesh = new THREE.Mesh(geom, petalMaterial);
      petalGroup.add(petalMesh);
      rootGroup.add(petalGroup);

      petals.push({
        group: petalGroup,
        mesh: petalMesh,
        whorl: cfg.whorl,
        baseAngle,
        openDelay: cfg.openDelay + i * 0.03,
        maxOpenAngle: cfg.maxOpenAngle + (i % 3 - 1) * 0.05,
        currentOpenAngle: 0.08,
        openVelocity: 0,
        length: cfg.length,
      });
    }
  }

  // ── 9. Dedicated Perch Slots for Butterflies ──
  const perchSlots: PerchSlot[] = [];
  const selectedPetalIndices = [petals.length - 2, petals.length - 5, petals.length - 7];
  for (let s = 0; s < 3; s++) {
    const pIdx = selectedPetalIndices[s % selectedPetalIndices.length];
    perchSlots.push({
      slotIndex: s,
      petalIndex: pIdx,
      worldPosition: new THREE.Vector3(),
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      headingTangent: new THREE.Vector3(0, 0, 1),
      isOccupied: false,
      occupantId: null,
    });
  }

  return {
    rootGroup,
    stemMesh,
    sepalMeshes,
    leafMeshes,
    rootTendrils,
    receptacleMesh,
    nectarMesh,
    stamenMeshes,
    petals,
    perchSlots,
  };
}
