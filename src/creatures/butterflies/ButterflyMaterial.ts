import * as THREE from 'three';
import { wingVertexShader, wingFragmentShader, bodyVertexShader, bodyFragmentShader } from './ButterflyShaders';
import { getSpeciesTextures, SPECIES_THEMES } from './ButterflyTextures';

export interface ButterflyPalette {
  name: string;
  rim: string;
  core: string;
  accent: string;
  vein: string;
}

export const HOLOGRAPHIC_PALETTES: ButterflyPalette[] = SPECIES_THEMES.map((t) => ({
  name: t.name,
  rim: t.rimColor,
  core: t.coreColor,
  accent: t.accentColor,
  vein: t.veinColor,
}));

export interface ButterflyUniforms {
  uTime: { value: number };
  uRimColor: { value: THREE.Color };
  uCoreColor: { value: THREE.Color };
  uAccentColor: { value: THREE.Color };
  uVeinColor: { value: THREE.Color };
  uPhase: { value: number };
  uFlapFlex: { value: number };
  uHoloIntensity: { value: number };
  uProgress: { value: number };
  uMap?: { value: THREE.Texture | null };
}

export interface ButterflyMaterials {
  forewingMaterial: THREE.ShaderMaterial;
  hindwingMaterial: THREE.ShaderMaterial;
  bodyMaterial: THREE.ShaderMaterial;
  uniforms: ButterflyUniforms;
}

/**
 * Creates individual shader materials for a butterfly instance
 */
export function createButterflyMaterials(
  colorIndex: number = 0,
  phaseOffset: number = 0
): ButterflyMaterials {
  const palette = HOLOGRAPHIC_PALETTES[colorIndex % HOLOGRAPHIC_PALETTES.length];
  const { forewing: fwTexture, hindwing: hwTexture } = getSpeciesTextures(colorIndex);

  const sharedUniforms: ButterflyUniforms = {
    uTime: { value: 0 },
    uRimColor: { value: new THREE.Color(palette.rim) },
    uCoreColor: { value: new THREE.Color(palette.core) },
    uAccentColor: { value: new THREE.Color(palette.accent) },
    uVeinColor: { value: new THREE.Color(palette.vein) },
    uPhase: { value: phaseOffset },
    uFlapFlex: { value: 1.0 },
    uHoloIntensity: { value: 1.0 }, // 1.0 = Holographic, 0.0 = Biological Solid
    uProgress: { value: 1.0 },      // 1.0 = Fully materialized
  };

  const forewingMaterial = new THREE.ShaderMaterial({
    vertexShader: wingVertexShader,
    fragmentShader: wingFragmentShader,
    uniforms: {
      ...sharedUniforms,
      uMap: { value: fwTexture },
    },
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const hindwingMaterial = new THREE.ShaderMaterial({
    vertexShader: wingVertexShader,
    fragmentShader: wingFragmentShader,
    uniforms: {
      ...sharedUniforms,
      uMap: { value: hwTexture },
    },
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const bodyMaterial = new THREE.ShaderMaterial({
    vertexShader: bodyVertexShader,
    fragmentShader: bodyFragmentShader,
    uniforms: {
      uTime: sharedUniforms.uTime,
      uRimColor: sharedUniforms.uRimColor,
      uCoreColor: sharedUniforms.uCoreColor,
      uHoloIntensity: sharedUniforms.uHoloIntensity,
      uProgress: sharedUniforms.uProgress,
    },
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  return {
    forewingMaterial,
    hindwingMaterial,
    bodyMaterial,
    uniforms: sharedUniforms,
  };
}
