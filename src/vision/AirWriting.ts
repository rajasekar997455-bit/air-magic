import type { StrokePoint, RecognitionResult } from '../types';
import { distance2D } from '../utils/Math';

const NUM_RESAMPLE_POINTS = 32;

export interface Point2D {
  x: number;
  y: number;
}

export class AirWritingRecognizer {
  private currentStroke: StrokePoint[] = [];
  private completedStrokes: StrokePoint[][] = [];
  private lastDrawTime: number = 0;
  private isCurrentlyDrawing: boolean = false;
  private strokeTimeoutMs: number = 850; // 0.85s after lifting finger
  private templates: Map<string, Point2D[]> = new Map();

  constructor() {
    this.initTemplates();
  }

  private initTemplates() {
    // Generate prototypical normalized templates for supported words/shapes

    // CIRCLE / PORTAL
    const circle: Point2D[] = [];
    for (let i = 0; i < NUM_RESAMPLE_POINTS; i++) {
      const angle = (i / (NUM_RESAMPLE_POINTS - 1)) * Math.PI * 2;
      circle.push({ x: 0.5 + 0.45 * Math.cos(angle), y: 0.5 + 0.45 * Math.sin(angle) });
    }
    this.templates.set('PORTAL', this.normalizePoints(circle));

    // STAR (5-pointed star trajectory)
    const starPoints: Point2D[] = [
      { x: 0.5, y: 0.1 },
      { x: 0.85, y: 0.9 },
      { x: 0.1, y: 0.35 },
      { x: 0.9, y: 0.35 },
      { x: 0.15, y: 0.9 },
      { x: 0.5, y: 0.1 },
    ];
    this.templates.set('STAR', this.normalizePoints(this.interpolatePath(starPoints)));

    // LOVE (Heart shape)
    const heart: Point2D[] = [];
    for (let i = 0; i < NUM_RESAMPLE_POINTS; i++) {
      const t = (i / (NUM_RESAMPLE_POINTS - 1)) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      heart.push({ x: x / 35 + 0.5, y: y / 35 + 0.5 });
    }
    this.templates.set('LOVE', this.normalizePoints(heart));

    // MAGIC (M-wave with loop/slash)
    const magic: Point2D[] = [
      { x: 0.1, y: 0.9 },
      { x: 0.2, y: 0.2 },
      { x: 0.35, y: 0.7 },
      { x: 0.5, y: 0.2 },
      { x: 0.6, y: 0.9 },
      { x: 0.75, y: 0.3 },
      { x: 0.9, y: 0.8 },
    ];
    this.templates.set('MAGIC', this.normalizePoints(this.interpolatePath(magic)));

    // HELLO (H cursive-like loop)
    const hello: Point2D[] = [
      { x: 0.1, y: 0.1 },
      { x: 0.1, y: 0.9 },
      { x: 0.1, y: 0.5 },
      { x: 0.4, y: 0.5 },
      { x: 0.4, y: 0.1 },
      { x: 0.4, y: 0.9 },
      { x: 0.6, y: 0.5 },
      { x: 0.75, y: 0.2 },
      { x: 0.9, y: 0.9 },
    ];
    this.templates.set('HELLO', this.normalizePoints(this.interpolatePath(hello)));

    // FIRE (Flickering jagged upward flame trajectory)
    const fire: Point2D[] = [
      { x: 0.2, y: 0.9 },
      { x: 0.35, y: 0.4 },
      { x: 0.5, y: 0.7 },
      { x: 0.5, y: 0.1 },
      { x: 0.65, y: 0.6 },
      { x: 0.8, y: 0.3 },
      { x: 0.85, y: 0.9 },
    ];
    this.templates.set('FIRE', this.normalizePoints(this.interpolatePath(fire)));

    // CHIEF (C curve into bold horizontal slash)
    const chief: Point2D[] = [
      { x: 0.8, y: 0.2 },
      { x: 0.3, y: 0.2 },
      { x: 0.2, y: 0.5 },
      { x: 0.3, y: 0.8 },
      { x: 0.8, y: 0.8 },
      { x: 0.85, y: 0.4 },
      { x: 0.1, y: 0.4 },
      { x: 0.9, y: 0.4 },
    ];
    this.templates.set('CHIEF', this.normalizePoints(this.interpolatePath(chief)));

    // JARVIS (J hook into A triangle)
    const jarvis: Point2D[] = [
      { x: 0.3, y: 0.1 },
      { x: 0.3, y: 0.7 },
      { x: 0.2, y: 0.85 },
      { x: 0.1, y: 0.7 },
      { x: 0.5, y: 0.9 },
      { x: 0.7, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.6, y: 0.5 },
      { x: 0.8, y: 0.5 },
    ];
    this.templates.set('JARVIS', this.normalizePoints(this.interpolatePath(jarvis)));

    // AI (A into I bar)
    const ai: Point2D[] = [
      { x: 0.1, y: 0.9 },
      { x: 0.35, y: 0.1 },
      { x: 0.6, y: 0.9 },
      { x: 0.25, y: 0.5 },
      { x: 0.45, y: 0.5 },
      { x: 0.8, y: 0.2 },
      { x: 0.8, y: 0.9 },
    ];
    this.templates.set('AI', this.normalizePoints(this.interpolatePath(ai)));

    // BUTTERFLY (Winged infinity / double wing loop)
    const butterflyPoints: Point2D[] = [
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.2 },
      { x: 0.1, y: 0.4 },
      { x: 0.3, y: 0.6 },
      { x: 0.15, y: 0.8 },
      { x: 0.35, y: 0.9 },
      { x: 0.5, y: 0.5 },
      { x: 0.8, y: 0.2 },
      { x: 0.9, y: 0.4 },
      { x: 0.7, y: 0.6 },
      { x: 0.85, y: 0.8 },
      { x: 0.65, y: 0.9 },
      { x: 0.5, y: 0.5 },
    ];
    this.templates.set('BUTTERFLY', this.normalizePoints(this.interpolatePath(butterflyPoints)));
  }

  private interpolatePath(anchors: Point2D[], targetCount = NUM_RESAMPLE_POINTS): Point2D[] {
    const points: Point2D[] = [];
    for (let i = 0; i < anchors.length - 1; i++) {
      const p1 = anchors[i];
      const p2 = anchors[i + 1];
      const segSteps = Math.ceil(targetCount / (anchors.length - 1));
      for (let s = 0; s < segSteps; s++) {
        const t = s / segSteps;
        points.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        });
      }
    }
    points.push(anchors[anchors.length - 1]);
    return points;
  }

  addPoint(x: number, y: number, isDrawing: boolean): RecognitionResult | null {
    const now = performance.now();

    if (isDrawing) {
      this.lastDrawTime = now;
      if (!this.isCurrentlyDrawing) {
        this.isCurrentlyDrawing = true;
        this.currentStroke = [];
      }

      // Add point if moved noticeably to avoid duplicate dense points
      const last = this.currentStroke[this.currentStroke.length - 1];
      if (!last || distance2D(last.x, last.y, x, y) > 0.004) {
        this.currentStroke.push({ x, y, timestamp: now });
      }
      return null;
    } else {
      if (this.isCurrentlyDrawing) {
        this.isCurrentlyDrawing = false;
        if (this.currentStroke.length > 5) {
          this.completedStrokes.push([...this.currentStroke]);
        }
        this.currentStroke = [];
      }

      // Check if stroke timeout has elapsed and we have strokes to recognize
      if (this.completedStrokes.length > 0 && now - this.lastDrawTime > this.strokeTimeoutMs) {
        const result = this.recognizeAllStrokes();
        this.completedStrokes = [];
        this.currentStroke = [];
        return result;
      }
    }

    return null;
  }

  checkTimeout(force = false): RecognitionResult | null {
    const now = performance.now();
    if (this.isCurrentlyDrawing && force) {
      this.isCurrentlyDrawing = false;
      if (this.currentStroke.length > 5) {
        this.completedStrokes.push([...this.currentStroke]);
      }
      this.currentStroke = [];
    }

    if (this.completedStrokes.length > 0 && (force || now - this.lastDrawTime > this.strokeTimeoutMs)) {
      const result = this.recognizeAllStrokes();
      this.completedStrokes = [];
      this.currentStroke = [];
      return result;
    }
    return null;
  }

  private recognizeAllStrokes(): RecognitionResult {
    // Flatten all points from completed strokes
    const allPoints: Point2D[] = [];
    for (const stroke of this.completedStrokes) {
      for (const p of stroke) {
        allPoints.push({ x: p.x, y: p.y });
      }
    }

    if (allPoints.length < 10) {
      return { word: 'SPELL UNCLEAR', confidence: 0.2 };
    }

    // 1. Check circle / portal geometry first
    if (this.isClosedCircle(allPoints)) {
      return { word: 'PORTAL', confidence: 0.92, isPortalCircle: true };
    }

    // 2. $1 Recognizer template matching
    const resampled = this.resample(allPoints, NUM_RESAMPLE_POINTS);
    const normalized = this.normalizePoints(resampled);

    let bestMatch = 'SPELL UNCLEAR';
    let minDistance = Infinity;

    for (const [name, template] of this.templates.entries()) {
      const dist = this.pathDistance(normalized, template);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = name;
      }
    }

    // Convert distance to confidence (0..1)
    const confidence = Math.max(0, Math.min(1, 1.0 - minDistance / 0.8));

    if (confidence < 0.58) {
      return { word: 'SPELL UNCLEAR', confidence };
    }

    return {
      word: bestMatch,
      confidence,
      isPortalCircle: bestMatch === 'PORTAL',
    };
  }

  private isClosedCircle(points: Point2D[]): boolean {
    // Need enough points for a meaningful circle trajectory
    if (points.length < 18) return false;

    const start = points[0];
    const end = points[points.length - 1];

    // Compute centroid
    let cx = 0, cy = 0;
    for (const p of points) { cx += p.x; cy += p.y; }
    cx /= points.length;
    cy /= points.length;

    // Compute average radius and variance
    let avgRadius = 0;
    const radii: number[] = [];
    for (const p of points) {
      const r = distance2D(p.x, p.y, cx, cy);
      radii.push(r);
      avgRadius += r;
    }
    avgRadius /= points.length;

    // Must be at least 6% of screen wide — too tiny = accidental jitter
    if (avgRadius < 0.06) return false;

    // Must be genuinely round — low radial variance
    let variance = 0;
    for (const r of radii) variance += Math.pow(r - avgRadius, 2);
    variance /= points.length;
    const stdDev = Math.sqrt(variance) / avgRadius;
    if (stdDev > 0.30) return false;

    // Start and end must actually MEET — closure within 60% of radius
    // (this stops open arcs and C-curves from triggering)
    const closureDist = distance2D(start.x, start.y, end.x, end.y);
    if (closureDist > avgRadius * 0.60) return false;

    // Must sweep a full revolution — at least 7 of 8 octants (315°)
    // This stops lines, letters, and partial arcs from passing
    const anglesHit = new Set<number>();
    for (const p of points) {
      const angle = Math.atan2(p.y - cy, p.x - cx);
      const bucket = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 8) % 8;
      anglesHit.add(bucket);
    }
    if (anglesHit.size < 7) return false;

    return true;
  }

  private resample(points: Point2D[], n: number): Point2D[] {
    const totalLength = this.pathLength(points);
    if (totalLength === 0 || points.length < 2) {
      return new Array(n).fill({ x: points[0]?.x ?? 0.5, y: points[0]?.y ?? 0.5 });
    }

    const interval = totalLength / (n - 1);
    const newPoints: Point2D[] = [points[0]];
    let accumulatedDist = 0;

    let srcIdx = 1;
    let currP = points[0];

    while (srcIdx < points.length && newPoints.length < n) {
      const nextP = points[srcIdx];
      const segDist = distance2D(currP.x, currP.y, nextP.x, nextP.y);

      if (accumulatedDist + segDist >= interval) {
        const t = (interval - accumulatedDist) / segDist;
        const interpP = {
          x: currP.x + t * (nextP.x - currP.x),
          y: currP.y + t * (nextP.y - currP.y),
        };
        newPoints.push(interpP);
        currP = interpP;
        accumulatedDist = 0;
      } else {
        accumulatedDist += segDist;
        currP = nextP;
        srcIdx++;
      }
    }

    while (newPoints.length < n) {
      newPoints.push(points[points.length - 1]);
    }

    return newPoints;
  }

  private pathLength(points: Point2D[]): number {
    let len = 0;
    for (let i = 0; i < points.length - 1; i++) {
      len += distance2D(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }
    return len;
  }

  private normalizePoints(points: Point2D[]): Point2D[] {
    if (points.length === 0) return [];

    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const w = Math.max(0.001, maxX - minX);
    const h = Math.max(0.001, maxY - minY);
    const scale = Math.max(w, h);

    return points.map(p => ({
      x: (p.x - minX) / scale,
      y: (p.y - minY) / scale,
    }));
  }

  private pathDistance(ptsA: Point2D[], ptsB: Point2D[]): number {
    let d = 0;
    const len = Math.min(ptsA.length, ptsB.length);
    for (let i = 0; i < len; i++) {
      d += distance2D(ptsA[i].x, ptsA[i].y, ptsB[i].x, ptsB[i].y);
    }
    return d / len;
  }

  clear() {
    this.currentStroke = [];
    this.completedStrokes = [];
    this.isCurrentlyDrawing = false;
  }

  getCurrentStrokePoints(): StrokePoint[] {
    return this.currentStroke;
  }
}
