export type GestureType = 'IDLE' | 'POINT' | 'OPEN_PALM' | 'FIST' | 'PINCH' | 'TWO_FINGERS' | 'THREE_FINGERS' | 'ROCK' | 'THUMBS_UP' | 'SHAKA' | 'LOVE_SIGN' | 'BUTTERFLY_WINGS' | 'CROSSED_FINGERS' | 'FLOWER_BUD';

export type DrawingMode = 'PEN' | 'PARTICLE' | 'ENERGY' | 'FIRE' | 'GALAXY';

export type PerformanceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export type PortalType = 'VOID' | 'GOLDEN' | 'GALAXY' | 'LAVA' | 'CYBER' | 'ICE' | 'NATURE' | 'NEON' | 'SYMBOL_OF_LOVE';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface StrokePoint {
  x: number; // 0..1 screen coord
  y: number; // 0..1 screen coord
  timestamp: number;
  pressure?: number;
}

export interface Stroke {
  points: StrokePoint[];
  startTime: number;
  endTime: number;
}

export interface RecognitionResult {
  word: string;
  confidence: number;
  isPortalCircle?: boolean;
}

export interface SharedInteractionState {
  // Hand tracking
  handDetected: boolean;
  confidence: number;
  landmarks: Landmark[];
  rawFingertip: Landmark;
  smoothedFingertip: Landmark;
  screenFingertip: { x: number; y: number }; // normalized 0..1 (0=left, 1=right, 0=top, 1=bottom)
  worldFingertip: { x: number; y: number; z: number }; // Three.js world coordinates
  velocity: { x: number; y: number };

  // Second hand (for dual-hand portal scaling)
  secondHandDetected: boolean;
  secondHandFingertip: { x: number; y: number; z: number };
  secondHandGesture: GestureType;
  handSpreadDistance: number; // distance between the two hands (world units)

  // Gestures
  gesture: GestureType;
  prevGesture: GestureType;
  pinchDistance: number;
  pinchCenter: { x: number; y: number };
  isDrawing: boolean;
  mode: DrawingMode;

  // Air writing & Effects
  activeEffect: string | null;
  effectProgress: number; // 0..1
  recognizedWord: string | null;
  recognizedTimestamp: number;
  wordConfidence: number;
  spellUnclear: boolean;
  portalActive: boolean;
  portalPosition: { x: number; y: number; z: number };
  portalType: PortalType;
  portalScale: number;
  lightningActive: boolean;
  lightningTarget: { x: number; y: number; z: number };
  butterfliesActive: boolean;

  // Special effect states
  auroraActive: boolean;
  auroraHoldTime: number;
  fistActive: boolean;
  fistHoldTime: number;
  portalHoldTime: number;        // seconds PINCH has been held — opens portal
  portalCloseHoldTime: number;   // seconds THREE_FINGERS has been held — closes portal
  flowersActive: boolean;        // Holographic flowers active
  flowersEnabled: boolean;       // Flower ecosystem ON/OFF switch (default false)
  flowerCount: number;           // Active flower count
  flowerHoldTime: number;        // seconds FLOWER_BUD has been held

  // System states
  cameraVisible: boolean;
  audioEnabled: boolean;
  isRecording: boolean;
  isDemoMode: boolean;
  debugMode: boolean;
  tier: PerformanceTier;

  // Telemetry
  fps: number;
  frameTime: number;
  renderTime: number;
  trackingLatency: number;
  particleCount: number;
}

export const createDefaultState = (): SharedInteractionState => ({
  handDetected: false,
  confidence: 0,
  landmarks: [],
  rawFingertip: { x: 0.5, y: 0.5, z: 0 },
  smoothedFingertip: { x: 0.5, y: 0.5, z: 0 },
  screenFingertip: { x: 0.5, y: 0.5 },
  worldFingertip: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0 },
  secondHandDetected: false,
  secondHandFingertip: { x: 0, y: 0, z: 0 },
  secondHandGesture: 'IDLE',
  handSpreadDistance: 0,
  gesture: 'IDLE',
  prevGesture: 'IDLE',
  pinchDistance: 1.0,
  pinchCenter: { x: 0.5, y: 0.5 },
  isDrawing: false,
  mode: 'PEN',
  activeEffect: null,
  effectProgress: 0,
  recognizedWord: null,
  recognizedTimestamp: 0,
  wordConfidence: 0,
  spellUnclear: false,
  portalActive: false,
  portalPosition: { x: 0, y: 0, z: 0 },
  portalType: 'NEON',
  portalScale: 1.0,
  lightningActive: false,
  lightningTarget: { x: 0, y: 0, z: 0 },
  butterfliesActive: false,
  auroraActive: false,
  auroraHoldTime: 0,
  fistActive: false,
  fistHoldTime: 0,
  portalHoldTime: 0,
  portalCloseHoldTime: 0,
  flowersActive: false,
  flowersEnabled: false,
  flowerCount: 0,
  flowerHoldTime: 0,
  cameraVisible: true,
  audioEnabled: false,
  isRecording: false,
  isDemoMode: false,
  debugMode: false,
  tier: 'HIGH',
  fps: 60,
  frameTime: 16.6,
  renderTime: 5.0,
  trackingLatency: 12.0,
  particleCount: 8000,
});
