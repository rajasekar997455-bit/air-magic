import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { SharedInteractionState, Landmark } from '../types';
import { LandmarkSmoother } from './Smoothing';
import { GestureDetector } from './GestureDetector';
import { AirWritingRecognizer } from './AirWriting';
import { CoordinateMapper } from '../utils/Coordinates';

export class HandTracker {
  private video: HTMLVideoElement | null = null;
  private handLandmarker: HandLandmarker | null = null;
  public isInitialized = false;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastVideoTime = -1;
  private lastInferenceTime = 0;
  private minInferenceInterval = 32; // ~30 FPS vision throttle for maximum smoothness

  private smoother = new LandmarkSmoother(1.2, 0.02, 1.0);
  private smoother2 = new LandmarkSmoother(1.2, 0.02, 1.0); // second hand
  private gestureDetector = new GestureDetector();
  private gestureDetector2 = new GestureDetector(); // second hand
  public airWriting = new AirWritingRecognizer();
  private coordinateMapper: CoordinateMapper | null = null;

  public state: SharedInteractionState;
  public onWordRecognized?: (word: string, confidence: number) => void;
  public onError?: (error: string) => void;

  constructor(state: SharedInteractionState) {
    this.state = state;
  }

  setCoordinateMapper(mapper: CoordinateMapper) {
    this.coordinateMapper = mapper;
  }

  async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    this.video = videoElement;

    try {
      // 1. Load vision WASM
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('./wasm');
      } catch (e) {
        console.warn('Local wasm failed, trying CDN:', e);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      // 2. Initialize HandLandmarker with GPU delegate and CPU fallback
      const modelAssetPath = './models/hand_landmarker.task';
      const cdnModelPath =
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

      const optionsList = [
        { modelAssetPath, delegate: 'GPU' as const },
        { modelAssetPath, delegate: 'CPU' as const },
        { modelAssetPath: cdnModelPath, delegate: 'GPU' as const },
        { modelAssetPath: cdnModelPath, delegate: 'CPU' as const },
      ];

      for (const opt of optionsList) {
        try {
          this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: opt.modelAssetPath,
              delegate: opt.delegate,
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (this.handLandmarker) break;
        } catch (err) {
          console.warn(`HandLandmarker init failed with ${opt.delegate}:`, err);
        }
      }

      if (!this.handLandmarker) {
        throw new Error('Could not initialize HandLandmarker with any delegate.');
      }

      this.isInitialized = true;
      return true;
    } catch (err: any) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', err);
      if (this.onError) {
        this.onError(err.message || 'MediaPipe initialization failed');
      }
      return false;
    }
  }

  async startCamera(): Promise<boolean> {
    if (!this.video) return false;

    // Use 640x480 for 4x faster neural network inference & zero lag
    const resolutions = [
      { width: 640, height: 480 },
      { width: 960, height: 540 },
      { width: 1280, height: 720 },
    ];

    let stream: MediaStream | null = null;
    let errorMsg = '';

    for (const res of resolutions) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: res.width },
            height: { ideal: res.height },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });
        if (stream) break;
      } catch (err: any) {
        errorMsg = err.message;
      }
    }

    if (!stream) {
      if (this.onError) {
        this.onError(errorMsg || 'Unable to access camera');
      }
      return false;
    }

    this.video.srcObject = stream;
    this.video.setAttribute('autoplay', 'true');
    this.video.setAttribute('playsinline', 'true');
    this.video.setAttribute('muted', 'true');

    await new Promise<void>((resolve) => {
      if (!this.video) return resolve();
      this.video.onloadedmetadata = () => {
        this.video?.play().then(() => resolve()).catch(() => resolve());
      };
      // Timeout fallback
      setTimeout(resolve, 1000);
    });

    this.startTrackingLoop();
    return true;
  }

  private startTrackingLoop() {
    this.isRunning = true;

    const loop = () => {
      if (!this.isRunning) return;

      const now = performance.now();

      // Throttle inference to match webcam frame rate (~30 FPS) so Three.js renders at 60+ FPS
      if (
        this.video &&
        this.video.readyState >= 2 &&
        this.handLandmarker &&
        !this.state.isDemoMode &&
        now - this.lastInferenceTime >= this.minInferenceInterval
      ) {
        if (this.video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = this.video.currentTime;
          this.lastInferenceTime = now;

          const startTime = performance.now();
          let detections: any = null;

          try {
            detections = this.handLandmarker.detectForVideo(this.video, now);
          } catch (e) {
            console.warn('Vision detection error:', e);
          }

          this.state.trackingLatency = performance.now() - startTime;

          if (detections && detections.landmarks && detections.landmarks.length > 0) {
            const rawLandmarks: Landmark[] = detections.landmarks[0];
            const score = detections.handedness?.[0]?.[0]?.score ?? 0.9;

            this.state.handDetected = true;
            this.state.confidence = score;
            this.state.landmarks = rawLandmarks;

            // Index fingertip is landmark 8
            const rawIndexTip = rawLandmarks[8];
            this.state.rawFingertip = rawIndexTip;

            // Smooth fingertip position
            const { smoothed, velocity } = this.smoother.smooth(rawIndexTip, now / 1000);
            this.state.smoothedFingertip = smoothed;
            this.state.velocity = velocity;

            // Screen coordinates (mirrored for user perspective)
            const screenX = 1.0 - smoothed.x;
            const screenY = smoothed.y;
            this.state.screenFingertip = { x: screenX, y: screenY };

            // 3D world coordinates
            if (this.coordinateMapper) {
              const worldVec = this.coordinateMapper.screenToWorld(screenX, screenY, 0);
              this.state.worldFingertip = {
                x: worldVec.x,
                y: worldVec.y,
                z: worldVec.z,
              };
            }

            // Gesture recognition — primary hand
            const { gesture, isDrawing, pinchDistance, pinchCenter } =
              this.gestureDetector.detect(rawLandmarks, this.state.flowersEnabled);

            this.state.prevGesture = this.state.gesture;
            this.state.gesture = gesture;
            this.state.isDrawing = isDrawing;
            this.state.pinchDistance = pinchDistance;
            this.state.pinchCenter = {
              x: 1.0 - pinchCenter.x,
              y: pinchCenter.y,
            };

            // --- Second hand ---
            if (detections.landmarks.length > 1) {
              const rawLandmarks2: Landmark[] = detections.landmarks[1];
              const { smoothed: smoothed2 } = this.smoother2.smooth(rawLandmarks2[8], now / 1000);
              const screenX2 = 1.0 - smoothed2.x;
              const screenY2 = smoothed2.y;
              this.state.secondHandDetected = true;
              if (this.coordinateMapper) {
                const w2 = this.coordinateMapper.screenToWorld(screenX2, screenY2, 0);
                this.state.secondHandFingertip = { x: w2.x, y: w2.y, z: w2.z };

                // Spread distance between the two hand fingertips (world units)
                const dx = w2.x - this.state.worldFingertip.x;
                const dy = w2.y - this.state.worldFingertip.y;
                this.state.handSpreadDistance = Math.sqrt(dx * dx + dy * dy);
              }
              const { gesture: gesture2 } = this.gestureDetector2.detect(rawLandmarks2, this.state.flowersEnabled);
              this.state.secondHandGesture = gesture2;

              // Dual-Hand Butterfly Puppet Check: thumbs crossed / wrists near, fingers open
              const thumb1 = rawLandmarks[4];
              const thumb2 = rawLandmarks2[4];
              const wrist1 = rawLandmarks[0];
              const wrist2 = rawLandmarks2[0];
              const dThumb = Math.hypot(thumb1.x - thumb2.x, thumb1.y - thumb2.y);
              const dWrist = Math.hypot(wrist1.x - wrist2.x, wrist1.y - wrist2.y);
              if ((dThumb < 0.12 || dWrist < 0.18) && (gesture === 'OPEN_PALM' || gesture2 === 'OPEN_PALM')) {
                this.state.gesture = 'BUTTERFLY_WINGS';
              }

              // Dual-Hand Crossing Fingers Check: fingers of both hands crossed/interlocked, thumbs free
              const index1 = rawLandmarks[8];
              const index2 = rawLandmarks2[8];
              const middle1 = rawLandmarks[12];
              const middle2 = rawLandmarks2[12];
              const dFingers = Math.min(
                Math.hypot(index1.x - index2.x, index1.y - index2.y),
                Math.hypot(middle1.x - middle2.x, middle1.y - middle2.y)
              );
              if (dFingers < 0.16 && dThumb > 0.06) {
                this.state.gesture = 'CROSSED_FINGERS';
              }
            } else {
              this.state.secondHandDetected = false;
              this.state.handSpreadDistance = 0;
              this.smoother2.reset();
              this.gestureDetector2.reset();
            }

            // Air writing stroke recording and word recognition
            const recResult = this.airWriting.addPoint(screenX, screenY, isDrawing);
            if (recResult) {
              this.handleRecognizedResult(recResult);
            }
          } else {
            this.state.handDetected = false;
            this.state.confidence = 0;
            this.state.gesture = 'IDLE';
            this.state.isDrawing = false;
            this.state.secondHandDetected = false;
            this.state.handSpreadDistance = 0;
            this.smoother.reset();
            this.smoother2.reset();
            this.gestureDetector.reset();
            this.gestureDetector2.reset();

            const recResult = this.airWriting.addPoint(
              this.state.screenFingertip.x,
              this.state.screenFingertip.y,
              false
            );
            if (recResult) {
              this.handleRecognizedResult(recResult);
            }
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public handleRecognizedResult(result: { word: string; confidence: number; isPortalCircle?: boolean }) {
    if (result.word === 'SPELL UNCLEAR') {
      this.state.spellUnclear = true;
      this.state.recognizedWord = 'SPELL UNCLEAR';
      this.state.wordConfidence = result.confidence;
      this.state.recognizedTimestamp = performance.now();
      setTimeout(() => {
        if (this.state.recognizedWord === 'SPELL UNCLEAR') {
          this.state.spellUnclear = false;
          this.state.recognizedWord = null;
        }
      }, 1500);
      return;
    }

    this.state.spellUnclear = false;
    this.state.recognizedWord = result.word;
    this.state.wordConfidence = result.confidence;
    this.state.recognizedTimestamp = performance.now();
    this.state.activeEffect = result.word;

    if (result.isPortalCircle || result.word === 'PORTAL') {
      this.state.portalActive = true;
      this.state.portalPosition = { ...this.state.worldFingertip };
    }

    if (this.onWordRecognized) {
      this.onWordRecognized(result.word, result.confidence);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }
  }
}
