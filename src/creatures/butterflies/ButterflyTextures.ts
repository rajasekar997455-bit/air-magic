import * as THREE from 'three';

/**
 * High-Definition Procedural Butterfly Wing Textures
 * 
 * Generates authentic biological lepidopteran wing maps at 1024x1024:
 * - Accurate wing venation (closed discal cell, branching radial/median/cubital veins)
 * - Velvet black margins with glowing submarginal pearl lunules
 * - Multi-stop jewel-tone iridescent gradients (Blue Morpho, Sunset Monarch, etc.)
 * - Thin, self-illuminated glowing vein filigree
 */

export interface SpeciesTheme {
  name: string;
  rimColor: string;
  coreColor: string;
  accentColor: string;
  veinColor: string;
  darkChitin: string;
  lunuleColor: string;
}

export const SPECIES_THEMES: SpeciesTheme[] = [
  // 1. NEON BLUE MORPHO (Center hero butterfly from photo)
  {
    name: 'Blue Morpho',
    rimColor: '#00f0ff',
    coreColor: '#1a0066',
    accentColor: '#d916ff',
    veinColor: '#ffffff',
    darkChitin: '#04050a',
    lunuleColor: '#00ffff',
  },
  // 2. SUNSET MONARCH (Fiery orange/peach with black borders and white pearls)
  {
    name: 'Sunset Monarch',
    rimColor: '#ffd700',
    coreColor: '#ff4500',
    accentColor: '#ff9900',
    veinColor: '#fff2b3',
    darkChitin: '#0a0502',
    lunuleColor: '#ffffff',
  },
  // 3. EMERALD SWALLOWTAIL (Vivid emerald & lime iridescence)
  {
    name: 'Emerald Swallowtail',
    rimColor: '#00ffff',
    coreColor: '#004d26',
    accentColor: '#00e676',
    veinColor: '#d4ffff',
    darkChitin: '#020a05',
    lunuleColor: '#76ff03',
  },
  // 4. VIOLET GLASSWING (Ethereal lilac, fuchsia & neon violet)
  {
    name: 'Violet Glasswing',
    rimColor: '#38bdf8',
    coreColor: '#4c1d95',
    accentColor: '#c084fc',
    veinColor: '#ffffff',
    darkChitin: '#06030c',
    lunuleColor: '#e0e7ff',
  },
  // 5. SOLAR BIRDWING (Radiant warm gold & champagne amber)
  {
    name: 'Solar Birdwing',
    rimColor: '#ffe066',
    coreColor: '#7c3a00',
    accentColor: '#f59e0b',
    veinColor: '#fffbeb',
    darkChitin: '#0c0702',
    lunuleColor: '#fef08a',
  },
];

// Texture cache: speciesIndex -> { forewing: CanvasTexture, hindwing: CanvasTexture }
const textureCache = new Map<number, { forewing: THREE.CanvasTexture; hindwing: THREE.CanvasTexture }>();

/**
 * Draws an anatomical butterfly forewing onto a 1024x1024 canvas
 */
function drawForewingCanvas(theme: SpeciesTheme): HTMLCanvasElement {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, size, size);

  // 1. Wing Silhouette Path
  ctx.save();
  ctx.beginPath();
  // Root at bottom-left
  ctx.moveTo(80, 950);
  // Arched leading edge sweeping forward and outward to the apex
  ctx.bezierCurveTo(150, 400, 450, 100, 940, 80);
  // Apex rounded corner
  ctx.bezierCurveTo(980, 120, 970, 220, 920, 300);
  // Scalloped outer margin undulating down to tornus
  ctx.bezierCurveTo(860, 420, 890, 520, 830, 620);
  ctx.bezierCurveTo(780, 700, 800, 780, 720, 840);
  ctx.bezierCurveTo(650, 880, 600, 910, 500, 920);
  // Inner trailing margin back to root
  ctx.bezierCurveTo(350, 940, 200, 950, 80, 950);
  ctx.closePath();

  // Clip to wing silhouette
  ctx.clip();

  // 2. Base Jewel-Tone Iridescent Gradient
  const grad = ctx.createRadialGradient(250, 750, 80, 550, 450, 800);
  grad.addColorStop(0.0, theme.accentColor);
  grad.addColorStop(0.35, theme.coreColor);
  grad.addColorStop(0.80, theme.rimColor);
  grad.addColorStop(1.0, theme.darkChitin);
  ctx.fillStyle = grad;
  ctx.fill();

  // 3. Central Discal Cell (Anatomical closed loop)
  ctx.lineWidth = 14;
  ctx.strokeStyle = theme.darkChitin;
  ctx.beginPath();
  ctx.moveTo(120, 920);
  ctx.bezierCurveTo(220, 700, 350, 500, 500, 520);
  ctx.bezierCurveTo(560, 540, 480, 680, 350, 820);
  ctx.closePath();
  ctx.stroke();

  // Subtle glow inside discal cell
  const discalGlow = ctx.createRadialGradient(340, 680, 20, 340, 680, 200);
  discalGlow.addColorStop(0.0, '#ffffff');
  discalGlow.addColorStop(0.4, theme.accentColor);
  discalGlow.addColorStop(1.0, 'transparent');
  ctx.fillStyle = discalGlow;
  ctx.fill();

  // 4. Branching Radial & Median Veins
  const veinEndpoints = [
    { x: 920, y: 150 }, // R1
    { x: 950, y: 220 }, // R2
    { x: 920, y: 320 }, // R3
    { x: 880, y: 440 }, // R4
    { x: 840, y: 550 }, // M1
    { x: 800, y: 660 }, // M2
    { x: 740, y: 760 }, // M3
    { x: 650, y: 840 }, // Cu1
    { x: 540, y: 900 }, // Cu2
  ];

  // Draw dark vein bridges
  ctx.lineWidth = 12;
  ctx.strokeStyle = theme.darkChitin;
  ctx.lineCap = 'round';
  for (const ep of veinEndpoints) {
    ctx.beginPath();
    ctx.moveTo(420, 600);
    ctx.quadraticCurveTo(550, 580, ep.x, ep.y);
    ctx.stroke();
  }

  // Draw fine glowing vein core filaments
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = theme.veinColor;
  for (const ep of veinEndpoints) {
    ctx.beginPath();
    ctx.moveTo(420, 600);
    ctx.quadraticCurveTo(550, 580, ep.x, ep.y);
    ctx.stroke();
  }

  // 5. Velvet Black Outer Margin Band
  ctx.lineWidth = 55;
  ctx.strokeStyle = theme.darkChitin;
  ctx.stroke();

  // 6. Submarginal Pearl Lunules (Rows of glowing dots along the outer margin)
  for (let i = 0; i < veinEndpoints.length - 1; i++) {
    const p1 = veinEndpoints[i];
    const p2 = veinEndpoints[i + 1];
    const midX = (p1.x + p2.x) * 0.5;
    const midY = (p1.y + p2.y) * 0.5;

    // Outer pearl dot
    ctx.fillStyle = theme.lunuleColor;
    ctx.beginPath();
    ctx.arc(midX * 0.96, midY * 0.96, 6, 0, Math.PI * 2);
    ctx.fill();

    // Inner companion dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(midX * 0.92, midY * 0.92, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // 7. Outer Electric Luminous Edge Trim
  ctx.lineWidth = 6;
  ctx.strokeStyle = theme.rimColor;
  ctx.stroke();

  return canvas;
}

/**
 * Draws an anatomical butterfly hindwing onto a 1024x1024 canvas
 */
function drawHindwingCanvas(theme: SpeciesTheme): HTMLCanvasElement {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, size, size);

  // 1. Hindwing Silhouette Path (Rounded with scalloped tail lobes)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(150, 150); // Root hinge
  // Outer leading curve
  ctx.bezierCurveTo(400, 100, 750, 180, 880, 380);
  // Scalloped trailing margin with delicate swallowtail lobes
  ctx.bezierCurveTo(860, 500, 890, 600, 820, 720);
  // Small swallowtail tail tooth
  ctx.lineTo(840, 780);
  ctx.lineTo(790, 800);
  ctx.bezierCurveTo(700, 880, 550, 920, 400, 890);
  ctx.bezierCurveTo(250, 850, 150, 650, 120, 400);
  ctx.closePath();

  ctx.clip();

  // 2. Base Jewel-Tone Gradient
  const grad = ctx.createRadialGradient(350, 450, 60, 500, 550, 650);
  grad.addColorStop(0.0, theme.accentColor);
  grad.addColorStop(0.4, theme.coreColor);
  grad.addColorStop(0.85, theme.rimColor);
  grad.addColorStop(1.0, theme.darkChitin);
  ctx.fillStyle = grad;
  ctx.fill();

  // 3. Central Hindwing Discal Arc
  ctx.lineWidth = 12;
  ctx.strokeStyle = theme.darkChitin;
  ctx.beginPath();
  ctx.arc(350, 420, 140, 0, Math.PI * 1.6);
  ctx.stroke();

  // 4. Radiating Hindwing Veins
  const hindEndpoints = [
    { x: 850, y: 320 },
    { x: 880, y: 440 },
    { x: 840, y: 560 },
    { x: 810, y: 680 },
    { x: 740, y: 790 },
    { x: 620, y: 870 },
    { x: 480, y: 890 },
  ];

  ctx.lineWidth = 10;
  ctx.strokeStyle = theme.darkChitin;
  for (const ep of hindEndpoints) {
    ctx.beginPath();
    ctx.moveTo(350, 420);
    ctx.quadraticCurveTo(550, 520, ep.x, ep.y);
    ctx.stroke();
  }

  // Glowing vein filaments
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.veinColor;
  for (const ep of hindEndpoints) {
    ctx.beginPath();
    ctx.moveTo(350, 420);
    ctx.quadraticCurveTo(550, 520, ep.x, ep.y);
    ctx.stroke();
  }

  // 5. Velvet Black Border
  ctx.lineWidth = 45;
  ctx.strokeStyle = theme.darkChitin;
  ctx.stroke();

  // 6. Submarginal Lunule Dots
  for (let i = 0; i < hindEndpoints.length - 1; i++) {
    const p1 = hindEndpoints[i];
    const p2 = hindEndpoints[i + 1];
    const midX = (p1.x + p2.x) * 0.5;
    const midY = (p1.y + p2.y) * 0.5;

    ctx.fillStyle = theme.lunuleColor;
    ctx.beginPath();
    ctx.arc(midX * 0.94, midY * 0.94, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Luminous Edge Trim
  ctx.lineWidth = 5;
  ctx.strokeStyle = theme.rimColor;
  ctx.stroke();

  return canvas;
}

/**
 * Returns or generates high-definition wing textures for a given species
 */
export function getSpeciesTextures(speciesIndex: number): {
  forewing: THREE.CanvasTexture;
  hindwing: THREE.CanvasTexture;
} {
  const idx = speciesIndex % SPECIES_THEMES.length;
  if (textureCache.has(idx)) {
    return textureCache.get(idx)!;
  }

  const theme = SPECIES_THEMES[idx];
  const fwCanvas = drawForewingCanvas(theme);
  const hwCanvas = drawHindwingCanvas(theme);

  const forewing = new THREE.CanvasTexture(fwCanvas);
  forewing.generateMipmaps = true;
  forewing.minFilter = THREE.LinearMipmapLinearFilter;
  forewing.magFilter = THREE.LinearFilter;

  const hindwing = new THREE.CanvasTexture(hwCanvas);
  hindwing.generateMipmaps = true;
  hindwing.minFilter = THREE.LinearMipmapLinearFilter;
  hindwing.magFilter = THREE.LinearFilter;

  const pair = { forewing, hindwing };
  textureCache.set(idx, pair);
  return pair;
}
