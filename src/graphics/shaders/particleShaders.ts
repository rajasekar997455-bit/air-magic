export const particleVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  
  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation based on depth
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 120.0);
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;

    // Distance from center of point (0.0 to 0.5)
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) discard;

    // Smooth circular glowing soft falloff
    float glow = smoothstep(0.5, 0.0, dist);
    float core = smoothstep(0.2, 0.0, dist);

    vec3 finalColor = vColor + vec3(core * 0.4);
    float finalAlpha = vAlpha * (glow * 0.85 + core * 0.5);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export const trailVertexShader = `
  attribute float aAlpha;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const trailFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;
