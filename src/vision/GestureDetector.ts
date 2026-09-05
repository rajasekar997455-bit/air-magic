import type { Landmark, GestureType } from '../types';
import { distance3D } from '../utils/Math';

/**
 * Robust gesture detector using relative finger extension ratios.
 * Does NOT require strained/unnatural hand poses — natural pointing,
 * relaxed fists, and easy open palms are all detected reliably.
 */
export class GestureDetector {
  private currentGesture: GestureType = 'IDLE';
  private gestureCandidate: GestureType = 'IDLE';
  private candidateFrames: number = 0;

  // Per-gesture debounce: POINT is fast (1 frame), others slower for stability
  private readonly debounceMap: Record<GestureType, number> = {
    IDLE: 3,
    POINT: 1,       // Instant — start drawing as soon as you point
    OPEN_PALM: 3,
    FIST: 2,        // Responsive fist detection
    PINCH: 1,       // Instant — responsive pinch
    TWO_FINGERS: 3,
    THREE_FINGERS: 2, // Quick 3-finger gesture for closing portal
    ROCK: 2,        // Quick rock on (index + pinky) gesture
    THUMBS_UP: 2,   // Thumbs up gesture
    SHAKA: 2,       // Dedicated butterfly summon / dance gesture (🤙)
    LOVE_SIGN: 2,   // Dedicated butterfly perch gesture (🤟)
    BUTTERFLY_WINGS: 2, // Dedicated dual-hand butterfly wing flutter
    CROSSED_FINGERS: 1, // Instant crossing fingers gesture (🤞)
    FLOWER_BUD: 1,      // Instant all-5 fingertip bud gesture (🤌)
  };

  private wasPinching: boolean = false;

  detect(landmarks: Landmark[], flowersEnabled: boolean = false): {
    gesture: GestureType;
    isDrawing: boolean;
    pinchDistance: number;
    pinchCenter: { x: number; y: number };
  } {
    if (!landmarks || landmarks.length < 21) {
      this.currentGesture = 'IDLE';
      this.candidateFrames = 0;
      this.wasPinching = false;
      return {
        gesture: 'IDLE',
        isDrawing: false,
        pinchDistance: 1.0,
        pinchCenter: { x: 0.5, y: 0.5 },
      };
    }

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexTip = landmarks[8];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];
    const ringPip = landmarks[14];
    const ringTip = landmarks[16];
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20];

    // --- Distances from wrist (scale-independent) ---
    const dIndex = distance3D(indexTip, wrist);
    const dMiddle = distance3D(middleTip, wrist);
    const dRing = distance3D(ringTip, wrist);
    const dPinky = distance3D(pinkyTip, wrist);
    const dThumb = distance3D(thumbTip, wrist);

    // --- PIP (knuckle) distances from wrist ---
    const thumbMcp = landmarks[2];
    const dThumbMcp = Math.max(0.001, distance3D(thumbMcp, wrist));
    const dIndexPip = Math.max(0.001, distance3D(indexPip, wrist));
    const dMiddlePip = Math.max(0.001, distance3D(middlePip, wrist));
    const dRingPip = Math.max(0.001, distance3D(ringPip, wrist));
    const dPinkyPip = Math.max(0.001, distance3D(pinkyPip, wrist));

    // Extension ratio: > 1.0 means tip is further than PIP (finger is extended/open)
    // < 1.0 means tip is closer than PIP (finger is curled/fist)
    const extThumb = dThumb / dThumbMcp;
    const extIndex = dIndex / dIndexPip;
    const extMiddle = dMiddle / dMiddlePip;
    const extRing = dRing / dRingPip;
    const extPinky = dPinky / dPinkyPip;

    // --- Pinch detection (thumb tip ↔ index tip distance) ---
    const handScale = Math.max(0.01, distance3D(wrist, indexMcp));
    const pinchDist = distance3D(thumbTip, indexTip) / handScale;

    // Hysteresis: stay pinching until wide apart
    let isPinching: boolean;
    if (this.wasPinching) {
      isPinching = pinchDist < 0.60;
    } else {
      isPinching = pinchDist < 0.38;
    }
    this.wasPinching = isPinching;

    const pinchCenter = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2,
    };

    // --- Classify gesture ---
    let raw: GestureType = 'IDLE';

    // 1. Clenched fist check (all 4 fingers curled inward)
    const isFist = (
      extIndex < 0.96 &&
      extMiddle < 0.96 &&
      extRing < 0.96 &&
      extPinky < 0.96
    );

    // Distance between index tip and middle tip (normalized by hand scale)
    const dIndexMiddle = distance3D(indexTip, middleTip) / handScale;
    const isCrossingFingers = (
      extIndex > 0.88 &&
      extMiddle > 0.88 &&
      dIndexMiddle < 0.24 &&
      !isPinching
    );

    // All-five fingertip cluster centroid (Flower Bud 🤌)
    // STRICT GATING: Only computed and recognized when flowersEnabled is true!
    let isFlowerBud = false;
    if (flowersEnabled && !isFist && !isCrossingFingers && extIndex > 0.60) {
      const budCenterX = (thumbTip.x + indexTip.x + middleTip.x + ringTip.x + pinkyTip.x) * 0.2;
      const budCenterY = (thumbTip.y + indexTip.y + middleTip.y + ringTip.y + pinkyTip.y) * 0.2;
      const budCenterZ = (thumbTip.z + indexTip.z + middleTip.z + ringTip.z + pinkyTip.z) * 0.2;
      const budCenter = { x: budCenterX, y: budCenterY, z: budCenterZ };

      const dT = distance3D(thumbTip, budCenter);
      const dI = distance3D(indexTip, budCenter);
      const dM = distance3D(middleTip, budCenter);
      const dR = distance3D(ringTip, budCenter);
      const dP = distance3D(pinkyTip, budCenter);

      const avgTipSpread = (dT + dI + dM + dR + dP) * 0.2 / handScale;
      const maxTipSpread = Math.max(dT, dI, dM, dR, dP) / handScale;
      const dFingersAdjacent = Math.max(
        distance3D(indexTip, middleTip),
        distance3D(middleTip, ringTip),
        distance3D(ringTip, pinkyTip)
      ) / handScale;

      isFlowerBud = (avgTipSpread < 0.35 || maxTipSpread < 0.38) && dFingersAdjacent < 0.38;
    }

    if (isFist) {
      // Clenched fist has priority: NEVER classified as PINCH or FLOWER_BUD
      if (extThumb > 1.15) {
        raw = 'THUMBS_UP';
      } else {
        raw = 'FIST';
      }
    } else if (flowersEnabled && isFlowerBud) {
      // FLOWER_BUD (🤌): Only recognized when Flower Mode is explicitly ON
      raw = 'FLOWER_BUD';
    } else if (isCrossingFingers) {
      // CROSSED_FINGERS (🤞): Crossing index and middle fingers
      raw = 'CROSSED_FINGERS';
    } else if (isPinching) {
      // PINCH (🤏): Thumb & index tips meet -> PORTAL
      raw = 'PINCH';
    } else if (
      !isPinching &&
      extIndex > 1.05 &&                // index is extended
      extIndex > extMiddle + 0.10 &&    // index notably more extended than middle
      extIndex > extRing + 0.12         // index notably more extended than ring
    ) {
      // POINT (☝️): Natural pointing pose -> AIR DRAWING
      raw = 'POINT';
    } else if (
      extThumb > 1.15 &&
      extPinky > 1.05 &&
      extIndex < 0.98 &&
      extMiddle < 0.98 &&
      extRing < 0.98
    ) {
      // SHAKA (🤙): Butterfly dance
      raw = 'SHAKA';
    } else if (
      extThumb > 1.05 &&
      extIndex > 1.05 &&
      extPinky > 1.05 &&
      extMiddle < 0.98 &&
      extRing < 0.98
    ) {
      // LOVE_SIGN (🤟): Butterfly perch
      raw = 'LOVE_SIGN';
    } else if (
      extIndex > 1.05 &&
      extPinky > 1.05 &&
      extMiddle < 0.98 &&
      extRing < 0.98
    ) {
      // ROCK (🤘): Rock on horns
      raw = 'ROCK';
    } else if (
      extThumb > 1.15 &&
      extIndex < 0.98 &&
      extMiddle < 0.98 &&
      extRing < 0.98 &&
      extPinky < 0.98
    ) {
      // THUMBS_UP (👍): Thumbs up
      raw = 'THUMBS_UP';
    } else if (
      extIndex > 1.02 &&
      extMiddle > 1.02 &&
      extRing > 1.02 &&
      extPinky < 0.98
    ) {
      // THREE_FINGERS (3️⃣): Dispel/close active portal (checked before TWO_FINGERS)
      raw = 'THREE_FINGERS';
    } else if (
      extIndex > 1.05 &&
      extMiddle > 1.05 &&
      extRing < 1.00 &&
      extPinky < 1.00
    ) {
      // TWO_FINGERS (✌️): Smile Spell (ring & pinky strictly curled down)
      raw = 'TWO_FINGERS';
    } else if (
      extIndex > 1.0 &&
      extMiddle > 1.0 &&
      extRing > 1.0 &&
      extPinky > 1.0
    ) {
      // OPEN_PALM (🖐️): Open palm
      raw = 'OPEN_PALM';
    } else {
      raw = 'IDLE';
    }

    // --- Per-gesture debounce state machine ---
    const needed = this.debounceMap[raw] ?? 3;
    if (raw === this.gestureCandidate) {
      this.candidateFrames++;
      if (this.candidateFrames >= needed) {
        this.currentGesture = raw;
      }
    } else {
      this.gestureCandidate = raw;
      this.candidateFrames = 1;
    }

    return {
      gesture: this.currentGesture,
      isDrawing: this.currentGesture === 'POINT',
      pinchDistance: pinchDist,
      pinchCenter,
    };
  }

  reset() {
    this.currentGesture = 'IDLE';
    this.gestureCandidate = 'IDLE';
    this.candidateFrames = 0;
    this.wasPinching = false;
  }
}
