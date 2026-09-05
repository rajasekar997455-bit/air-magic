import * as THREE from 'three';
import { ParticleSystem } from '../../graphics/ParticleSystem';
import type { PortalType } from '../../types';

export interface PortalRenderer {
  readonly type: PortalType;
  readonly group: THREE.Group;
  
  /** Called when this portal type is activated */
  activate(scale: number): void;
  
  /** Update animations, uniforms, rotation, and type-specific particles */
  update(
    dt: number,
    age: number,
    maxAge: number,
    envScale: number,
    currentScale: number,
    particleSystem: ParticleSystem,
    portalPos: THREE.Vector3
  ): void;
  
  /** Dispose of all Three.js geometries, materials, and children */
  dispose(): void;
}

/** Standard additive glowing tube material helper */
export function makeTubeMat(color: number, opacity = 0.95): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
