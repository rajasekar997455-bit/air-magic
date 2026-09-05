export interface TextParticleTarget {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
}

export class TextParticleGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 300;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  generateTargets(
    text: string,
    color: { r: number; g: number; b: number },
    targetCount = 1200,
    scale = 0.02
  ): TextParticleTarget[] {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px "Arial Black", "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const validPixels: Array<{ x: number; y: number }> = [];

    // Scan pixels
    const step = 4;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const idx = (y * canvas.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 128) {
          validPixels.push({ x, y });
        }
      }
    }

    if (validPixels.length === 0) return [];

    const results: TextParticleTarget[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < targetCount; i++) {
      const p = validPixels[Math.floor(Math.random() * validPixels.length)];
      const jitterX = (Math.random() - 0.5) * step;
      const jitterY = (Math.random() - 0.5) * step;

      const worldX = (p.x + jitterX - cx) * scale;
      const worldY = -(p.y + jitterY - cy) * scale; // Flip Y for Three.js
      const worldZ = (Math.random() - 0.5) * 0.4;

      results.push({
        x: worldX,
        y: worldY,
        z: worldZ,
        r: color.r * (0.8 + Math.random() * 0.4),
        g: color.g * (0.8 + Math.random() * 0.4),
        b: color.b * (0.8 + Math.random() * 0.4),
      });
    }

    return results;
  }
}
