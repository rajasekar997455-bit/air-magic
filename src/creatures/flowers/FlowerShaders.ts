/**
 * Holographic Botanical Flower Shaders
 * 
 * Features:
 * - Translucent jewel-tone petal gradient with subtle botanical venation
 * - Fresnel edge luminescence highlighting the 3D petal dish curves
 * - NormalBlending-compatible (zero blowout, vivid contrast)
 * - Nectar energy pulse when butterflies drink
 * - Smooth dissolve wave for natural lifecycle fade
 */

export const petalVertexShader = `
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;

  // Gentle ambient petal breathing motion
  vec3 transformed = position;
  float flutter = sin(uTime * 1.5 + position.z * 4.0) * 0.012 * uv.y;
  transformed.y += flutter;

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vNormal = normalize(normalMatrix * normal);
  vViewPosition = -mvPosition.xyz;
  vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
}
`;

export const petalFragmentShader = `
uniform float uTime;
uniform vec3 uBaseColor;      // Basal receptacle hue (warm cream / jade)
uniform vec3 uPetalColor;     // Midsection hue (lotus rose / celestial violet / solar amber)
uniform vec3 uTipColor;       // Edge & tip hue (luminous electric magenta / cyan / gold)
uniform vec3 uNectarColor;    // Flowing nectar hue
uniform float uNectarPulse;   // 0.0 to 1.0 active drinking pulse
uniform float uProgress;      // Lifecycle progress (0.0 to 1.0)
uniform float uHoloIntensity; // 0.0 = biological, 1.0 = holographic

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Dissolve wave
  float dissolveCutoff = 1.0 - uProgress;
  float noiseVal = hash(vUv * 9.0);
  if (vUv.y + noiseVal * 0.15 < dissolveCutoff) {
    discard;
  }

  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Delicate Fresnel edge glow along petal curvature
  float NdotV = abs(dot(viewDir, normal));
  float fresnel = pow(1.0 - NdotV, 2.2);

  // 1. Botanical Petal Gradient (Base -> Mid -> Tip)
  float v = vUv.y;
  vec3 gradientColor = mix(uBaseColor, uPetalColor, smoothstep(0.05, 0.45, v));
  gradientColor = mix(gradientColor, uTipColor, smoothstep(0.55, 0.95, v));

  // 2. Fine Botanical Longitudinal Petal Veins
  float rays = sin(vUv.x * 35.0) * 0.5 + 0.5;
  float veins = smoothstep(0.82, 0.98, rays) * smoothstep(0.1, 0.9, v);
  vec3 veinColor = mix(gradientColor, uTipColor, 0.6) + vec3(0.15, 0.15, 0.2);
  vec3 basePetal = mix(gradientColor, veinColor, veins * 0.35);

  // 3. Nectar Feeding Energy Pulse (Waves radiating from base when butterfly feeds)
  float pulseWave = sin(v * 12.0 - uTime * 6.0) * 0.5 + 0.5;
  vec3 nectarGlow = uNectarColor * (pulseWave * uNectarPulse * 0.65);
  basePetal += nectarGlow;

  // 4. Holographic Rim Accent
  vec3 rim = uTipColor * (fresnel * 0.55 * uHoloIntensity);
  basePetal += rim;

  // Scanline and micro-flicker
  float scanline = sin(vWorldPosition.y * 70.0 - uTime * 3.5) * 0.5 + 0.5;
  scanline = mix(1.0, 0.94 + 0.06 * scanline, uHoloIntensity);
  basePetal *= scanline;

  // Clamp output
  vec3 finalColor = clamp(basePetal, 0.0, 1.0);
  float alpha = mix(0.78, 0.96, fresnel) * uProgress;

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const nectarVertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vec3 transformed = position;
  transformed.y += sin(uTime * 3.0 + position.x * 10.0) * 0.008;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vNormal = normalize(normalMatrix * normal);
  vViewPosition = -mvPosition.xyz;
}
`;

export const nectarFragmentShader = `
uniform float uTime;
uniform vec3 uNectarColor;
uniform float uNectarLevel;  // 0.0 (empty) to 1.0 (full)
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float NdotV = max(0.0, dot(viewDir, normal));
  float fresnel = pow(1.0 - NdotV, 2.0);

  // Pulsing radiant nectar core
  float pulse = sin(uTime * 4.0) * 0.15 + 0.85;
  vec3 color = uNectarColor * pulse * (NdotV * 0.6 + 0.4 + fresnel * 0.5);

  // Fade as nectar is consumed
  color *= (0.25 + 0.75 * uNectarLevel);
  float alpha = (0.5 + 0.5 * uNectarLevel) * uProgress;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`;

export const stemFragmentShader = `
uniform vec3 uStemColor;
uniform float uProgress;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float NdotV = max(0.0, dot(viewDir, normal));
  vec3 color = uStemColor * (NdotV * 0.7 + 0.3);
  gl_FragColor = vec4(color, 0.95 * uProgress);
}
`;
