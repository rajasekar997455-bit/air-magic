import * as THREE from 'three';
import { ParticleSystem } from '../graphics/ParticleSystem';

// ═══════════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC SMILE SPELL EFFECT (✌️ Two-Finger Gesture Effect)
// • Background: Large, recognizable, glowing Smile Emoji 🙂 (#FFD54F)
// • Foreground: Large, clearly readable, glowing "SMILE" typography (#FFF8C6)
// • Proportions: Text width ~48% of emoji diameter
// • Layering: Emoji (background, z=0) -> SMILE (foreground, z=0.25) -> subtle sparkles
// • No bright particle blobs, rings, or donuts.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates the high-resolution texture for the large 🙂 Smile Emoji.
 * Uses crisp, recognizable facial features:
 * - Golden yellow circular face (#FFD54F) with soft ambient glow
 * - Two distinct espresso-brown capsule eyes with white specular catchlights
 * - Wide joyful curved smiling mouth with dimples
 * - Soft rosy cheek blushes
 */
function createSmileEmojiTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const faceRadius = 390;

  // 1. Soft Outer Ambient Golden Glow (Warm atmospheric halo)
  const glowGrad = ctx.createRadialGradient(cx, cy, faceRadius - 20, cx, cy, 490);
  glowGrad.addColorStop(0, 'rgba(255, 213, 79, 0.55)');
  glowGrad.addColorStop(0.4, 'rgba(255, 193, 7, 0.3)');
  glowGrad.addColorStop(0.75, 'rgba(255, 160, 0, 0.12)');
  glowGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 490, 0, Math.PI * 2);
  ctx.fill();

  // 2. Iconic Circular Smiley Face (#FFD54F theme)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2);

  // Subtle top-light gradient for rich dimensional polish
  const faceGrad = ctx.createRadialGradient(cx - 70, cy - 100, 40, cx, cy, faceRadius);
  faceGrad.addColorStop(0, '#FFF59D');   // Soft sunny highlight
  faceGrad.addColorStop(0.35, '#FFD54F'); // Requested Golden Yellow
  faceGrad.addColorStop(0.85, '#FFCA28'); // Warm golden amber
  faceGrad.addColorStop(1, '#FFA000');   // Deep golden edge
  ctx.fillStyle = faceGrad;
  ctx.fill();

  // Face border outline
  ctx.strokeStyle = '#FF8F00';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Inner subtle highlight rim
  ctx.beginPath();
  ctx.arc(cx, cy, faceRadius - 10, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  // 3. Soft Rosy Cheeks
  const drawCheek = (x: number, y: number) => {
    ctx.save();
    const cheekGrad = ctx.createRadialGradient(x, y, 10, x, y, 70);
    cheekGrad.addColorStop(0, 'rgba(255, 112, 67, 0.35)');
    cheekGrad.addColorStop(1, 'rgba(255, 112, 67, 0)');
    ctx.fillStyle = cheekGrad;
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCheek(cx - 220, cy + 30);
  drawCheek(cx + 220, cy + 30);

  // 4. Two Clearly Visible Dark Oval Eyes (Unmistakable Emoji Eyes)
  const drawEye = (x: number, y: number) => {
    ctx.save();
    // Solid dark espresso capsule eye
    ctx.beginPath();
    ctx.ellipse(x, y, 32, 54, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#261608';
    ctx.shadowColor = 'rgba(38, 22, 8, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Primary bright white specular catchlight
    ctx.beginPath();
    ctx.arc(x - 9, y - 18, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.fill();

    // Secondary soft catchlight
    ctx.beginPath();
    ctx.arc(x + 10, y + 14, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.restore();
  };

  // Eyes positioned in the upper portion of the face
  drawEye(cx - 135, cy - 95);
  drawEye(cx + 135, cy - 95);

  // 5. Clearly Curved Joyful Smiling Mouth (Classic 🙂 Arc)
  ctx.save();
  ctx.beginPath();
  // Wide curved smile arc centered comfortably below the eyes
  ctx.arc(cx, cy + 25, 205, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.strokeStyle = '#261608';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(38, 22, 8, 0.35)';
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Dimple accents at smile tips
  const drawDimple = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.strokeStyle = '#261608';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  };
  drawDimple(cx - 175, cy + 135, -0.45);
  drawDimple(cx + 175, cy + 135, 0.45);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates the high-resolution texture for the large foreground "SMILE" word.
 * - Color theme: Bright white/yellow #FFF8C6 with golden emissive glow
 * - Contrast drop-border for razor-sharp readability over the yellow emoji
 */
function createSmileTextTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 360;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const text = 'SMILE';
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  // Large, bold, highly readable typography
  ctx.font = '900 180px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Heavy dark contrast border (Ensures 100% sharp readability over yellow emoji)
  ctx.strokeStyle = '#0E0500';
  ctx.lineWidth = 28;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, cx, cy);

  // 2. Glowing golden-orange neon rim
  ctx.strokeStyle = '#FF6D00';
  ctx.lineWidth = 14;
  ctx.shadowColor = '#FF5100';
  ctx.shadowBlur = 24;
  ctx.strokeText(text, cx, cy);

  // 3. Bright golden halo accent
  ctx.strokeStyle = '#FFA000';
  ctx.lineWidth = 6;
  ctx.strokeText(text, cx, cy);

  // 4. Brilliant Radiant Core Fill (Bright White & Warm Yellow #FFF8C6)
  const grad = ctx.createLinearGradient(0, cy - 80, 0, cy + 80);
  grad.addColorStop(0, '#FFFFFF');    // Pure brilliant white top
  grad.addColorStop(0.4, '#FFFFFF');   // Crisp white core
  grad.addColorStop(0.75, '#FFF8C6'); // Requested bright white/yellow
  grad.addColorStop(1, '#FFECB3');    // Soft golden-cream base

  ctx.fillStyle = grad;
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 16;
  ctx.fillText(text, cx, cy);

  // 5. Crisp inner specular highlight
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.strokeText(text, cx, cy);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export class SmileEffect {
  public group = new THREE.Group();
  public isActive = false;

  private age = 0;
  private isFadingOut = false;
  private fadeTimer = 0;
  private readonly fadeDuration = 0.5;

  // Background Smile Emoji Mesh (🙂)
  private emojiMesh!: THREE.Mesh;
  private emojiMat!: THREE.MeshBasicMaterial;
  private emojiTexture!: THREE.CanvasTexture;

  // Foreground "SMILE" Typography Mesh
  private textMesh!: THREE.Mesh;
  private textMat!: THREE.MeshBasicMaterial;
  private textTexture!: THREE.CanvasTexture;

  private targetPos = new THREE.Vector3(0, 0, 0);
  private hasEmittedSparkBurst = false;
  private maxDuration = 0;

  constructor(scene: THREE.Scene) {
    this.buildGeometry();
    this.group.visible = false;
    scene.add(this.group);
  }

  private buildGeometry() {
    // 1. Background Smile Emoji Mesh (Large, dominant, diameter = 5.8 units)
    this.emojiTexture = createSmileEmojiTexture();
    this.emojiMat = new THREE.MeshBasicMaterial({
      map: this.emojiTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending, // NormalBlending preserves dark eyes and mouth contrast!
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });

    const emojiGeom = new THREE.PlaneGeometry(5.8, 5.8);
    this.emojiMesh = new THREE.Mesh(emojiGeom, this.emojiMat);
    this.emojiMesh.position.set(0, 0, 0.0);
    this.emojiMesh.renderOrder = 9998;
    this.group.add(this.emojiMesh);

    // 2. Foreground "SMILE" Typography Mesh (Width = 2.8 units ~ 48% of emoji diameter)
    this.textTexture = createSmileTextTexture();
    this.textMat = new THREE.MeshBasicMaterial({
      map: this.textTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending, // NormalBlending keeps letters sharp with zero burnout
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });

    const textGeom = new THREE.PlaneGeometry(3.4, 1.2);
    this.textMesh = new THREE.Mesh(textGeom, this.textMat);
    this.textMesh.position.set(0, -0.1, 0.25); // Layered distinctly in front (z = +0.25)
    this.textMesh.renderOrder = 9999;
    this.group.add(this.textMesh);
  }

  trigger(pos: { x: number; y: number; z: number }, _particleSystem?: ParticleSystem, maxDuration: number = 0) {
    this.isActive = true;
    this.isFadingOut = false;
    this.fadeTimer = 0;
    this.age = 0;
    this.maxDuration = maxDuration;
    this.hasEmittedSparkBurst = false;
    this.group.visible = true;

    // Anchor position
    this.targetPos.set(pos.x, pos.y, pos.z);
    this.group.position.copy(this.targetPos);

    // Initial scale and zero opacity
    this.group.scale.set(0.7, 0.7, 0.7);
    this.emojiMat.opacity = 0;
    this.textMat.opacity = 0;
  }

  stop(particleSystem?: ParticleSystem) {
    if (!this.isActive) return;
    this.isFadingOut = true;
    this.fadeTimer = 0;

    // Subtle gentle dispersion around perimeter when dissolving
    if (particleSystem) {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = 3.2 + Math.random() * 0.5;
        particleSystem.emitParticle(
          this.group.position.x + Math.cos(angle) * rad,
          this.group.position.y + Math.sin(angle) * rad,
          this.group.position.z,
          Math.cos(angle) * 1.0,
          Math.sin(angle) * 1.0 + 0.3,
          0,
          1.0, 0.9, 0.4,
          5,
          0.6,
          0
        );
      }
    }
  }

  update(
    dt: number,
    particleSystem: ParticleSystem,
    handPos: { x: number; y: number; z: number },
    handDetected: boolean
  ) {
    if (!this.isActive) return;

    this.age += dt;

    // Auto close if max duration specified and reached
    if (this.maxDuration > 0 && this.age >= this.maxDuration && !this.isFadingOut) {
      this.stop(particleSystem);
    }

    // Smoothly follow hand anchor position
    if (handDetected) {
      this.targetPos.x += (handPos.x - this.targetPos.x) * 4.0 * dt;
      this.targetPos.y += (handPos.y - this.targetPos.y) * 4.0 * dt;
    }

    // ── Animation Phases ───────────────────────────────────────────────────
    if (!this.isFadingOut) {
      // Phase A: 0.0s → 0.3s: Large smile emoji smoothly materializes
      const emojiProgress = Math.min(1.0, this.age / 0.3);
      this.emojiMat.opacity = emojiProgress * 0.96;

      // Elastic scale-up to full size
      this.group.scale.setScalar(THREE.MathUtils.lerp(this.group.scale.x, 1.0, dt * 8.0));

      // Phase B: 0.3s → 0.6s: "SMILE" text appears in front of the emoji
      if (this.age >= 0.3) {
        const textProgress = Math.min(1.0, (this.age - 0.3) / 0.3);
        this.textMat.opacity = textProgress * 0.98;

        // Small, delicate sparkle burst around the perimeter of the emoji (never in the center!)
        if (!this.hasEmittedSparkBurst) {
          this.hasEmittedSparkBurst = true;
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const rad = 3.2 + Math.random() * 0.4;
            const px = this.group.position.x + Math.cos(angle) * rad;
            const py = this.group.position.y + Math.sin(angle) * rad;
            const pz = this.group.position.z + (Math.random() - 0.5) * 0.2;
            particleSystem.emitParticle(
              px, py, pz,
              Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, (Math.random() - 0.5) * 0.3,
              1.0, 0.95, 0.6,
              5, 0.7, 0
            );
          }
        }
      } else {
        this.textMat.opacity = 0;
      }

      // ── While holding ✌️ (Gentle Floating, Pulsing, & Rotation) ────────────
      // Emoji: pulses gently, slowly floats, slightly sways
      const emojiPulse = 1.0 + Math.sin(this.age * 1.8) * 0.03;
      this.emojiMesh.scale.set(emojiPulse, emojiPulse, 1.0);
      this.emojiMesh.rotation.z = Math.sin(this.age * 0.8) * 0.025;

      // Floating translation
      const floatY = Math.sin(this.age * 1.5) * 0.07;
      const floatX = Math.cos(this.age * 1.0) * 0.04;
      this.group.position.set(this.targetPos.x + floatX, this.targetPos.y + floatY, this.targetPos.z);

      // Text: pulses gently and breathes while remaining 100% readable
      const textPulse = 1.0 + Math.sin(this.age * 2.2) * 0.02;
      this.textMesh.scale.set(textPulse, textPulse, 1.0);
      if (this.age >= 0.6) {
        const glowPulse = 0.94 + Math.sin(this.age * 3.5) * 0.06;
        this.textMat.opacity = glowPulse;
      }

      // ── Subtle Magical Sparkles (Scattered OUTSIDE the emoji circle) ───────
      // Small amount of sparkles: ~1 particle per frame every 3-4 frames (no donut!)
      if (Math.random() < 0.28) {
        const angle = Math.random() * Math.PI * 2;
        // Radius between 3.2 and 4.2 (safely outside the emoji face)
        const rad = 3.2 + Math.random() * 0.9;
        const px = this.group.position.x + Math.cos(angle) * rad;
        const py = this.group.position.y + Math.sin(angle) * rad + (Math.random() - 0.5) * 0.3;
        const pz = this.group.position.z + (Math.random() - 0.5) * 0.4;

        // Soft golden/white colors
        const isWhite = Math.random() > 0.65;
        const pr = 1.0;
        const pg = isWhite ? 0.98 : 0.84;
        const pb = isWhite ? 0.85 : 0.3;

        particleSystem.emitParticle(
          px, py, pz,
          (Math.random() - 0.5) * 0.2,
          0.15 + Math.random() * 0.3,
          (Math.random() - 0.5) * 0.2,
          pr, pg, pb,
          6 + Math.random() * 3, // Delicate small sparkles (size 6-9)
          0.8 + Math.random() * 0.4,
          0
        );
      }
    } else {
      // ── When ✌️ ends: Smooth Dissolve ────────────────────────────────────
      this.fadeTimer += dt;
      const outProgress = Math.min(1.0, this.fadeTimer / this.fadeDuration);

      // 1. SMILE text fades first (over 0.25s)
      const textAlpha = Math.max(0, 1.0 - (this.fadeTimer / 0.25));
      this.textMat.opacity = textAlpha;

      // 2. Emoji fades smoothly over the full 0.5s
      const emojiAlpha = Math.max(0, 1.0 - outProgress);
      this.emojiMat.opacity = emojiAlpha * 0.96;

      // Gentle upward drift as it dissolves
      this.group.position.y += 0.35 * dt;
      this.group.scale.multiplyScalar(1.0 + 0.08 * dt);

      if (outProgress >= 1.0) {
        this.isActive = false;
        this.group.visible = false;
      }
    }
  }

  dispose() {
    this.emojiMesh.geometry.dispose();
    this.emojiMat.dispose();
    this.emojiTexture.dispose();

    this.textMesh.geometry.dispose();
    this.textMat.dispose();
    this.textTexture.dispose();

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
