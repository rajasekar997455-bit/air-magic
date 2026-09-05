import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, Play, AlertCircle } from 'lucide-react';
import { AirMagicLogo } from './components/AirMagicLogo';
import type { DrawingMode, PerformanceTier, SharedInteractionState } from './types';
import { createDefaultState } from './types';
import { GraphicsEngine } from './graphics/GraphicsEngine';
import { HandTracker } from './vision/HandTracker';
import { AudioEngine } from './audio/AudioEngine';
import { PerformanceManager } from './performance/PerformanceManager';
import { DemoController } from './demo/DemoController';
import { CameraView } from './components/CameraView';
import { HUD } from './components/HUD';
import { DebugPanel } from './components/DebugPanel';
import { Controls } from './components/Controls';

export const AirMagicApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [butterfliesActive, setButterfliesActive] = useState(false);
  const [flowersActive, setFlowersActive] = useState(false);
  const [flowersEnabled, setFlowersEnabled] = useState(false);
  const [, setCurrentMode] = useState<DrawingMode>('PEN');
  const [currentTier, setCurrentTier] = useState<PerformanceTier>('HIGH');
  const holoIntensityRef = useRef(1.0);

  // Shared Interaction State reference
  const stateRef = useRef<SharedInteractionState>(createDefaultState());
  const engineRef = useRef<GraphicsEngine | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const perfRef = useRef<PerformanceManager | null>(null);
  const demoRef = useRef<DemoController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize engine & systems on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const state = stateRef.current;
    const engine = new GraphicsEngine(containerRef.current, state);
    engineRef.current = engine;
    (window as any).airMagicEngine = engine;
    (window as any).airMagicState = state;

    const tracker = new HandTracker(state);
    tracker.setCoordinateMapper(engine.coordinateMapper);
    trackerRef.current = tracker;

    const audio = new AudioEngine();
    audioRef.current = audio;

    const perf = new PerformanceManager();
    perfRef.current = perf;

    const demo = new DemoController(state);
    demo.setCoordinateMapper(engine.coordinateMapper);
    demoRef.current = demo;

    // Word recognition sound callback
    tracker.onWordRecognized = (word: string) => {
      audio.playSpellSound(word);
    };

    tracker.onError = (err: string) => {
      setErrorMessage(err);
    };

    engine.start();

    // Mouse / Touch pointer interaction fallback
    const container = containerRef.current;
    let isPointerDown = false;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      updatePointerPos(e);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      updatePointerPos(e);
    };

    const handlePointerUp = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      if (!state.handDetected && !state.isDemoMode) {
        state.isDrawing = false;
        state.gesture = 'IDLE';
        tracker.airWriting.addPoint(state.screenFingertip.x, state.screenFingertip.y, false);
      }
    };

    const updatePointerPos = (e: PointerEvent) => {
      if (state.handDetected || state.isDemoMode) return;
      const rect = container.getBoundingClientRect();
      const sx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const sy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      state.screenFingertip = { x: sx, y: sy };
      const worldVec = engine.coordinateMapper.screenToWorld(sx, sy, 0);
      state.worldFingertip = { x: worldVec.x, y: worldVec.y, z: worldVec.z };
      state.isDrawing = true;
      state.gesture = 'POINT';

      const recResult = tracker.airWriting.addPoint(sx, sy, true);
      if (recResult) {
        tracker.handleRecognizedResult(recResult);
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Telemetry update interval & mouse air writing timeout check
    const perfInterval = setInterval(() => {
      perf.update(state);

      // Auto gesture sound triggers
      if (state.gesture !== state.prevGesture && state.gesture !== 'IDLE') {
        audio.playGestureSound(state.gesture);
      }

      setFlowersActive(Boolean(state.flowersActive));
      setFlowersEnabled(Boolean(state.flowersEnabled));

      // Check mouse air writing recognition
      if (!state.handDetected && !state.isDemoMode) {
        const timeoutResult = tracker.airWriting.checkTimeout();
        if (timeoutResult) {
          tracker.handleRecognizedResult(timeoutResult);
        }
      }
    }, 100);

    return () => {
      clearInterval(perfInterval);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      tracker.stop();
      engine.stop();
      demo.stop();
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!engineRef.current) return;
    const canvas = engineRef.current.getCanvas();

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      stateRef.current.isRecording = false;
    } else {
      try {
        const stream = canvas.captureStream(60);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `air-magic-recording-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        stateRef.current.isRecording = true;
      } catch (err: any) {
        console.error('MediaRecorder error:', err);
        setErrorMessage('Recording not supported on this browser.');
      }
    }
  }, [isRecording]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  // Keyboard shortcut listeners
  const PORTAL_TYPES = ['NEON', 'SYMBOL_OF_LOVE', 'GOLDEN', 'VOID', 'GALAXY', 'LAVA', 'CYBER', 'ICE', 'NATURE'] as const;
  const portalTypeIdxRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      const key = e.key.toUpperCase();
      const state = stateRef.current;

      if (['1', '2', '3', '4', '5'].includes(key)) {
        const modes: DrawingMode[] = ['PEN', 'PARTICLE', 'ENERGY', 'FIRE', 'GALAXY'];
        const selected = modes[parseInt(key) - 1];
        state.mode = selected;
        setCurrentMode(selected);
      } else if (key === 'D') {
        state.debugMode = !state.debugMode;
        setDebugMode(state.debugMode);
      } else if (key === 'M') {
        const isMuted = audioRef.current?.toggleMute() ?? true;
        state.audioEnabled = !isMuted;
        setAudioEnabled(!isMuted);
      } else if (key === 'R') {
        toggleRecording();
      } else if (key === 'U') {
        toggleFullscreen();
      } else if (key === 'G') {
        // ── G: Toggle Flower Mode (ON/OFF) ──
        const next = engineRef.current?.effectsManager.toggleFlowers(state) ?? false;
        setFlowersEnabled(next);
        setFlowersActive(Boolean(state.flowersActive));
      } else if (key === 'F') {
        // ── F: Strictly conditional flower spawn (only when Flowers are ON) ──
        if (state.flowersEnabled && engineRef.current?.effectsManager.areFlowersEnabled()) {
          const pos = state.handDetected ? { ...state.worldFingertip } : { x: 0, y: -0.2, z: 0 };
          engineRef.current?.effectsManager.spawnFlower(pos, state);
          setFlowersActive(true);
        }
        // If FLOWERS OFF: F DOES NOTHING. Never secretly enables Flower Mode.
      } else if (key === 'C') {
        state.cameraVisible = !state.cameraVisible;
        setCameraVisible(state.cameraVisible);
      } else if (key === 'P') {
        // ── Instant portal at screen center (or hand position if detected) ──
        const pos = state.handDetected
          ? { ...state.worldFingertip }
          : { x: 0, y: 0, z: 0 };
        if (engineRef.current?.effectsManager.isPortalActive()) {
          // If already active, pressing P cycles to next portal
          const currentIdx = PORTAL_TYPES.indexOf(state.portalType as any);
          const nextIdx = (currentIdx + 1) % PORTAL_TYPES.length;
          const nextType = PORTAL_TYPES[nextIdx];
          portalTypeIdxRef.current = nextIdx;
          state.portalType = nextType;
          engineRef.current?.effectsManager.triggerPushPortal(pos, nextType);
        } else {
          // Open current selected portal
          const type = state.portalType ?? 'NEON';
          engineRef.current?.effectsManager.triggerPushPortal(pos, type);
        }
      } else if (key === 'B') {
        // ── Toggle Holographic Butterflies ──
        const next = !engineRef.current?.effectsManager.isButterfliesActive();
        engineRef.current?.effectsManager.toggleButterflies(state);
        setButterfliesActive(Boolean(next));
      } else if (key === 'H' && e.shiftKey) {
        // ── Realism Test: Toggle Holographic Shader vs Biological Solid ──
        const nextInt = holoIntensityRef.current > 0.5 ? 0.0 : 1.0;
        holoIntensityRef.current = nextInt;
        engineRef.current?.effectsManager.setButterflyHolographicIntensity(nextInt);
      } else if (e.key === '[') {
        // ── Cycle portal type backwards ──
        const currentIdx = PORTAL_TYPES.indexOf(state.portalType as any);
        const nextIdx = (currentIdx - 1 + PORTAL_TYPES.length) % PORTAL_TYPES.length;
        const nextType = PORTAL_TYPES[nextIdx];
        portalTypeIdxRef.current = nextIdx;
        state.portalType = nextType;
        if (engineRef.current?.effectsManager.isPortalActive()) {
          const pos = state.handDetected ? { ...state.worldFingertip } : { x: 0, y: 0, z: 0 };
          engineRef.current?.effectsManager.triggerPushPortal(pos, nextType);
        }
      } else if (e.key === ']') {
        // ── Cycle portal type forwards ──
        const currentIdx = PORTAL_TYPES.indexOf(state.portalType as any);
        const nextIdx = (currentIdx + 1) % PORTAL_TYPES.length;
        const nextType = PORTAL_TYPES[nextIdx];
        portalTypeIdxRef.current = nextIdx;
        state.portalType = nextType;
        if (engineRef.current?.effectsManager.isPortalActive()) {
          const pos = state.handDetected ? { ...state.worldFingertip } : { x: 0, y: 0, z: 0 };
          engineRef.current?.effectsManager.triggerPushPortal(pos, nextType);
        }
      } else if (key === 'S') {
        const eff = engineRef.current?.effectsManager;
        if (eff) {
          if (eff.isSmileActive()) {
            eff.stopSmile();
            state.auroraActive = false;
          } else {
            const pos = state.handDetected ? { ...state.worldFingertip } : { x: 0, y: 0, z: 0 };
            eff.triggerSmile(pos);
            state.auroraActive = true;
          }
        }
      } else if (key === ' ' || key === 'X') {
        engineRef.current?.particleSystem.clear();
        engineRef.current?.trailSystem.clear();
        engineRef.current?.effectsManager.deactivatePortals();
        engineRef.current?.effectsManager.stopSmile();
        engineRef.current?.effectsManager.clearFlowers(state);
        state.recognizedWord = null;
        state.auroraActive = false;
        state.auroraHoldTime = 0;
        state.portalHoldTime = 0;
        state.flowerHoldTime = 0;
        state.flowersActive = false;
        state.flowerCount = 0;
        setFlowersActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRecording]);

  const startWithCamera = async () => {
    setErrorMessage(null);
    if (!videoRef.current || !trackerRef.current) return;

    const initialized = await trackerRef.current.initialize(videoRef.current);
    if (!initialized) {
      setErrorMessage('MediaPipe Hand Vision failed to load. You can try Demo Mode.');
      return;
    }

    const cameraStarted = await trackerRef.current.startCamera();
    if (!cameraStarted) {
      setErrorMessage('Camera access was denied or unavailable. You can try Demo Mode.');
      return;
    }

    setIsStarted(true);
    setIsDemoMode(false);
    stateRef.current.isDemoMode = false;
  };

  const startWithDemo = () => {
    setErrorMessage(null);
    trackerRef.current?.stop();
    demoRef.current?.start();
    setIsStarted(true);
    setIsDemoMode(true);
    stateRef.current.isDemoMode = true;
    stateRef.current.cameraVisible = false;
    setCameraVisible(false);
  };

  const handleSelectMode = (mode: DrawingMode) => {
    stateRef.current.mode = mode;
    setCurrentMode(mode);
  };

  const handleSetTier = (tier: PerformanceTier) => {
    perfRef.current?.setTier(tier);
    stateRef.current.tier = tier;
    setCurrentTier(tier);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b090a] text-[#ebf2fa] font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-10 touch-none cursor-crosshair" />

      {/* Webcam Background View */}
      <CameraView videoRef={videoRef} isVisible={cameraVisible && isStarted && !isDemoMode} />

      {/* Futuristic HUD Overlay */}
      <HUD
        state={stateRef.current}
        isStarted={isStarted}
        onSelectMode={handleSelectMode}
        onClear={() => {
          engineRef.current?.particleSystem.clear();
          engineRef.current?.trailSystem.clear();
          engineRef.current?.effectsManager.deactivatePortals();
          engineRef.current?.effectsManager.stopSmile();
          engineRef.current?.effectsManager.clearFlowers(stateRef.current);
          engineRef.current?.effectsManager.deactivateButterflies(stateRef.current);
          setButterfliesActive(false);
          setFlowersActive(false);
          stateRef.current.recognizedWord = null;
          stateRef.current.auroraActive = false;
          stateRef.current.auroraHoldTime = 0;
          stateRef.current.portalHoldTime = 0;
          stateRef.current.flowerHoldTime = 0;
        }}
        onCyclePortal={() => {
          const currentIdx = PORTAL_TYPES.indexOf(stateRef.current.portalType as any);
          const nextIdx = (currentIdx + 1) % PORTAL_TYPES.length;
          const nextType = PORTAL_TYPES[nextIdx];
          portalTypeIdxRef.current = nextIdx;
          stateRef.current.portalType = nextType;
          const pos = stateRef.current.handDetected
            ? stateRef.current.worldFingertip
            : { x: 0, y: 0, z: 0 };
          engineRef.current?.effectsManager.triggerPushPortal(pos, nextType);
        }}
        onToggleSmile={() => {
          const eff = engineRef.current?.effectsManager;
          if (!eff) return;
          if (eff.isSmileActive() || stateRef.current.auroraActive) {
            eff.stopSmile();
            stateRef.current.auroraActive = false;
          } else {
            const pos = stateRef.current.handDetected
              ? { ...stateRef.current.worldFingertip }
              : { x: 0, y: 0, z: 0 };
            eff.triggerSmile(pos, 6.0);
            stateRef.current.auroraActive = true;
          }
        }}
      />

      {/* Debug Telemetry Panel */}
      <DebugPanel state={stateRef.current} isVisible={debugMode} />

      {/* Top Right Quick Controls */}
      {isStarted && (
        <Controls
          cameraVisible={cameraVisible}
          audioEnabled={audioEnabled}
          isRecording={isRecording}
          isDemoMode={isDemoMode}
          butterfliesActive={butterfliesActive}
          flowersActive={flowersActive}
          flowersEnabled={flowersEnabled}
          tier={currentTier}
          onToggleCamera={() => {
            const next = !cameraVisible;
            setCameraVisible(next);
            stateRef.current.cameraVisible = next;
          }}
          onToggleAudio={() => {
            const isMuted = audioRef.current?.toggleMute() ?? false;
            setAudioEnabled(!isMuted);
            stateRef.current.audioEnabled = !isMuted;
          }}
          onToggleRecording={toggleRecording}
          onToggleFullscreen={toggleFullscreen}
          onToggleDemo={() => {
            if (isDemoMode) startWithCamera();
            else startWithDemo();
          }}
          onToggleButterflies={() => {
            const next = !engineRef.current?.effectsManager.isButterfliesActive();
            engineRef.current?.effectsManager.toggleButterflies(stateRef.current);
            setButterfliesActive(Boolean(next));
          }}
          onToggleFlowers={() => {
            const next = engineRef.current?.effectsManager.toggleFlowers(stateRef.current) ?? false;
            setFlowersEnabled(next);
            setFlowersActive(Boolean(stateRef.current.flowersActive));
          }}
          onSpawnFlower={() => {
            if (stateRef.current.flowersEnabled && engineRef.current?.effectsManager.areFlowersEnabled()) {
              const pos = stateRef.current.worldFingertip;
              engineRef.current?.effectsManager.spawnFlower(pos, stateRef.current);
              setFlowersActive(true);
            }
          }}
          onClearFlowers={() => {
            engineRef.current?.effectsManager.clearFlowers(stateRef.current);
            setFlowersActive(false);
          }}
          onSetTier={handleSetTier}
        />
      )}

      {/* Initial Onboarding Landing Overlay */}
      {!isStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b090a]/95 backdrop-blur-xl p-6">
          <div className="max-w-xl w-full text-center flex flex-col items-center bg-[#0b090a]/90 border border-[rgba(235,242,250,0.15)] rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(235,242,250,0.06)] transition-all duration-500 ease-out hover:border-[rgba(235,242,250,0.45)] hover:shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_35px_rgba(235,242,250,0.22)] active:border-[rgba(235,242,250,0.65)] active:shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_45px_rgba(235,242,250,0.32)]">
            {/* Ambient Logo Glow with Exact AirMagicLogo */}
            <div className="relative mb-6 flex items-center justify-center">
              <div className="relative w-18 h-18 rounded-2xl bg-[#0b090a] border border-[rgba(235,242,250,0.22)] flex items-center justify-center shadow-[0_0_25px_rgba(235,242,250,0.14)]">
                <AirMagicLogo size={44} className="text-[#ebf2fa]" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[0.2em] text-[#ebf2fa] uppercase mb-3">
              AIR MAGIC
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#ebf2fa]/65 uppercase mb-6">
              Real-time Hand Tracking &bull; Air Writing &bull; GPU Visual Effects
            </p>

            <p className="text-sm text-[#ebf2fa]/75 max-w-md mb-8 leading-relaxed font-light">
              Stand in front of your webcam, point your index finger to write magical words in the air, or cast spells with natural hand gestures.
            </p>

            {errorMessage && (
              <div className="flex items-center gap-3 bg-[#0b090a] border border-red-500/30 px-4 py-3 rounded-xl text-red-300 text-xs mb-6 max-w-md font-mono">
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <button
                onClick={startWithCamera}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#ebf2fa] hover:bg-white text-[#0b090a] font-bold text-xs tracking-[0.14em] uppercase shadow-[0_0_25px_rgba(235,242,250,0.25)] hover:shadow-[0_0_35px_rgba(235,242,250,0.45)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Video size={16} className="stroke-[2.5]" />
                ENABLE CAMERA
              </button>

              <button
                onClick={startWithDemo}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0b090a] hover:bg-[#15171a] border border-[rgba(235,242,250,0.22)] hover:border-[rgba(235,242,250,0.60)] text-[#ebf2fa] font-semibold text-xs tracking-[0.14em] uppercase backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play size={16} />
                TRY DEMO MODE
              </button>
            </div>

            {/* Gesture Quick Hints */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-10 pt-8 border-t border-[rgba(235,242,250,0.12)] w-full text-[11px] font-medium">
              {[
                { emoji: '☝️', title: 'Point', desc: 'Air Draw' },
                { emoji: '🤏', title: 'Pinch', desc: 'Portal (1.5s)' },
                { emoji: '3️⃣', title: '3 Fingers', desc: 'Close Portal' },
                { emoji: '🖐️', title: 'Open Palm', desc: 'Move & Control' },
                { emoji: '🤞', title: 'Crossed', desc: 'Perch Hands' },
                { emoji: '✌️', title: 'Two Fingers', desc: 'Smile (2s)' },
              ].map((g, idx) => (
                <div
                  key={idx}
                  className="group cursor-default rounded-xl border border-[rgba(235,242,250,0.12)] hover:border-[rgba(235,242,250,0.45)] bg-[#0b090a] hover:bg-[#15171a] p-3 flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(235,242,250,0.12)]"
                >
                  <span className="text-base mb-0.5 select-none">{g.emoji}</span>
                  <span className="text-[#ebf2fa] font-semibold text-[11px] tracking-wide transition-colors">
                    {g.title}
                  </span>
                  <span className="text-[#ebf2fa]/50 text-[10px] font-mono">
                    {g.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirMagicApp;

