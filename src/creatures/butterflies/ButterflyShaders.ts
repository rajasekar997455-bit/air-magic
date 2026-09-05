/**
 * Photorealistic Holographic Butterfly Shaders
 * 
 * Combines high-definition procedural biological wing maps with futuristic holographic lighting:
 * - High-definition sampled anatomical wing textures (discal cell, radial veins, velvet margins, lunules)
 * - Traveling light pulses along the vein filigree
 * - Fresnel edge luminescence highlighting 3D wing curves
 * - NormalBlending-compatible (crisp contrast, rich jewel tones, zero whiteout)
 */

export const wingVertexShader = `
uniform float uTime;
uniform float uFlapFlex;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  
  // Aerodynamic wingtip flexing along the trailing edge
  vec3 transformed = position;
  float distFromBase = abs(position.x);
  transformed.y += sin(distFromBase * 3.5 - uTime * 8.0) * uFlapFlex * 0.035;

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vNormal = normalize(normalMatrix * normal);
  vViewPosition = -mvPosition.xyz;
  vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
}
`;

export const wingFragmentShader = `
uniform sampler2D uMap;        // High-definition anatomical wing texture
uniform float uTime;
uniform vec3 uRimColor;        // Outer margin & leading edge hue
uniform vec3 uVeinColor;       // Bright vein filigree
uniform float uPhase;          // Individual butterfly phase offset
uniform float uHoloIntensity;  // 0.0 = natural butterfly, 1.0 = futuristic hologram
uniform float uProgress;       // Spawn/dissolve animation (0.0 to 1.0)

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // ── Spawn & Dissolve Wave ──
  float dissolveCutoff = 1.0 - uProgress;
  float noiseVal = hash(vUv * 8.0);
  if (vUv.x + noiseVal * 0.15 < dissolveCutoff) {
    discard;
  }

  // Sample high-definition anatomical wing texture
  vec4 texColor = texture2D(uMap, vUv);
  if (texColor.a < 0.08) {
    discard; // Discard transparent canvas area outside wing silhouette
  }

  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Subtle Fresnel edge highlight on 3D curves
  float NdotV = abs(dot(viewDir, normal));
  float fresnel = pow(1.0 - NdotV, 2.5);

  // Traveling holographic energy pulse through the vein filigree
  float veinLuminance = smoothstep(0.65, 0.98, max(texColor.r, max(texColor.g, texColor.b)));
  float pulsePhase = vUv.x * 10.0 - uTime * 4.5 + uPhase * 6.28318;
  float pulse = pow(sin(pulsePhase) * 0.5 + 0.5, 3.0);
  vec3 brightVeins = uVeinColor * (veinLuminance * pulse * 0.45 * uHoloIntensity);

  // Subtle holographic scanline and stable micro-flicker
  float scanline = sin(vWorldPosition.y * 60.0 - uTime * 4.0) * 0.5 + 0.5;
  scanline = mix(1.0, 0.94 + 0.06 * scanline, uHoloIntensity);
  float flicker = 1.0 - 0.03 * step(0.98, sin(uTime * 24.0 + uPhase * 13.0));

  // Holographic Fresnel rim outline
  vec3 rimGlow = uRimColor * (fresnel * 0.40 * uHoloIntensity);

  // Combine texture color with holographic vein pulse and rim glow
  vec3 finalColor = texColor.rgb + brightVeins + rimGlow;
  finalColor *= scanline * flicker;
  finalColor = clamp(finalColor, 0.0, 1.0);

  // Translucent biological opacity
  float alpha = texColor.a * mix(0.85, 0.98, fresnel) * uProgress;

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const bodyVertexShader = `
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vNormal = normalize(normalMatrix * normal);
  vViewPosition = -mvPosition.xyz;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}
`;

export const bodyFragmentShader = `
uniform float uTime;
uniform vec3 uRimColor;
uniform vec3 uCoreColor;
uniform float uHoloIntensity;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  if (vUv.y < (1.0 - uProgress) * 0.95) {
    discard;
  }

  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Slender dark velvet butterfly body with subtle iridescent rim
  float NdotV = max(0.0, dot(viewDir, normal));
  float fresnel = pow(1.0 - NdotV, 2.8);

  vec3 darkChitin = vec3(0.04, 0.04, 0.06) * (NdotV * 0.7 + 0.3);
  vec3 holoRim = uRimColor * (fresnel * 0.70);

  vec3 finalColor = clamp(darkChitin + holoRim * uHoloIntensity, 0.0, 1.0);
  float alpha = mix(1.0, 0.95, uHoloIntensity) * uProgress;

  gl_FragColor = vec4(finalColor, alpha);
}
`;
