import React, { useState, useEffect } from 'react';
import type { SharedInteractionState, DrawingMode, GestureType } from '../types';

interface HUDProps {
  state: SharedInteractionState;
  isStarted: boolean;
  onSelectMode: (mode: DrawingMode) => void;
  onClear: () => void;
  onCyclePortal?: () => void;
  onToggleSmile?: () => void;
}

const GESTURE_ICONS: Record<GestureType, { label: string; icon: string }> = {
  IDLE: { label: 'WAITING', icon: '⏳' },
  POINT: { label: 'DRAWING', icon: '☝️' },
  OPEN_PALM: { label: 'SHOCKWAVE / CONTROL', icon: '🖐️' },
  FIST: { label: 'FIST / GRAB', icon: '✊' },
  PINCH: { label: 'PORTAL CHARGE', icon: '🤏' },
  TWO_FINGERS: { label: 'SMILE SPELL', icon: '✌️' },
  THREE_FINGERS: { label: 'CLOSE PORTAL', icon: '3️⃣' },
  ROCK: { label: 'ROCK ON', icon: '🤘' },
  THUMBS_UP: { label: 'THUMBS UP', icon: '👍' },
  SHAKA: { label: 'BUTTERFLY DANCE', icon: '🤙' },
  LOVE_SIGN: { label: 'BUTTERFLY PERCH', icon: '🤟' },
  BUTTERFLY_WINGS: { label: 'BUTTERFLY FLOCK', icon: '🦋' },
  CROSSED_FINGERS: { label: 'PERCH ON HANDS', icon: '🤞' },
  FLOWER_BUD: { label: 'SPROUT FLOWER', icon: '🤌' },
};

const PORTAL_TYPE_COLORS: Record<string, string> = {
  GOLDEN: 'text-yellow-400',
  VOID: 'text-purple-400',
  GALAXY: 'text-blue-400',
  LAVA: 'text-red-400',
  CYBER: 'text-cyan-400',
  ICE: 'text-sky-200',
  NATURE: 'text-emerald-400',
  NEON: 'text-amber-400',
  SYMBOL_OF_LOVE: 'text-rose-400',
};

export const HUD: React.FC<HUDProps> = ({ state, isStarted, onSelectMode, onClear, onCyclePortal, onToggleSmile }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 100); // 10 FPS HUD update - enough for telemetry without hurting WebGL
    return () => clearInterval(interval);
  }, []);

  if (!isStarted) return null;

  const currentGesture = GESTURE_ICONS[state.gesture] || GESTURE_ICONS.IDLE;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between pt-6 pb-6 px-6 select-none font-sans">
      {/* Top Bar: Minimal Status & Spell Announcement */}
      <div className="flex items-start justify-between w-full">
        {/* Tracking Status */}
        <div className="flex items-center gap-3 bg-[#0b090a]/90 backdrop-blur-md border border-[rgba(235,242,250,0.15)] px-4 py-2 rounded-xl shadow-[0_0_25px_rgba(0,0,0,0.7)]">
          <span
            className={`w-2.5 h-2.5 rounded-full ${state.handDetected
              ? 'bg-[#ebf2fa] shadow-[0_0_10px_#ebf2fa] animate-pulse'
              : 'bg-[#ebf2fa]/30'
              }`}
          />
          <span className="text-xs font-semibold tracking-wider text-[#ebf2fa] uppercase">
            {state.isDemoMode
              ? 'DEMO MODE'
              : state.handDetected
                ? 'TRACKING'
                : 'SEARCHING HAND'}
          </span>

          <div className="h-3 w-px bg-[rgba(235,242,250,0.15)] mx-1" />

          {/* Gesture pill */}
          <div className="flex items-center gap-1.5 text-xs text-[#ebf2fa] font-semibold">
            <span>{currentGesture.icon}</span>
            <span>{currentGesture.label}</span>
          </div>

          {/* Second hand detected indicator */}
          {state.secondHandDetected && (
            <>
              <div className="h-3 w-px bg-[rgba(235,242,250,0.15)] mx-1" />
              <div className="flex items-center gap-1 text-xs text-[#ebf2fa] font-medium">
                <span>🤲</span>
                <span>RESIZE ACTIVE</span>
              </div>
            </>
          )}

          {/* Holographic Butterfly Swarm Active Indicator */}
          {state.butterfliesActive && (
            <>
              <div className="h-3 w-px bg-[rgba(235,242,250,0.15)] mx-1" />
              <div className="flex items-center gap-1 text-xs text-[#ebf2fa] font-medium">
                <span>🦋</span>
                <span>
                  {state.gesture === 'CROSSED_FINGERS'
                    ? '🤞 PERCHING'
                    : state.gesture === 'SHAKA'
                      ? '🤙 DANCE'
                      : state.gesture === 'LOVE_SIGN'
                        ? '🤟 PERCH'
                        : state.gesture === 'BUTTERFLY_WINGS'
                          ? '🦋 FLOCK'
                          : 'SWARM'}
                </span>
              </div>
            </>
          )}

          {/* Holographic Flower System Status Indicator */}
          <div className="h-3 w-px bg-[rgba(235,242,250,0.15)] mx-1" />
          <div
            className={`flex items-center gap-1 text-xs font-semibold transition-colors ${state.flowersEnabled
                ? 'text-[#ebf2fa]'
                : 'text-[#ebf2fa]/50'
              }`}
          >
            <span className={state.flowersEnabled ? 'opacity-100' : 'grayscale opacity-50'}>🌸</span>
            <span>
              {state.flowersEnabled
                ? state.flowersActive
                  ? `${state.flowerCount} BLOOMING`
                  : 'FLOWERS: ON'
                : 'FLOWERS: OFF'}
            </span>
          </div>
        </div>

        {/* Spell Recognition Banner */}
        <div className="flex flex-col items-center">
          {state.recognizedWord && (
            <div
              className={`px-6 py-2 rounded-xl backdrop-blur-lg border transition-all duration-300 transform animate-bounce ${state.spellUnclear
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : 'bg-[#0A1012]/95 border-[#5CE1E6]/50 text-[#5CE1E6] shadow-[0_0_25px_rgba(92,225,230,0.3)]'
                }`}
            >
              <div className="text-[10px] tracking-widest uppercase text-[#829397] text-center">
                {state.spellUnclear ? 'CASTING FAILED' : 'SPELL ACTIVATED'}
              </div>
              <div className="text-lg font-black tracking-widest text-center">
                {state.recognizedWord}
              </div>
            </div>
          )}
        </div>

        {/* Top Right Status Badges (stacked beneath controls) */}
        <div className="flex flex-col items-end gap-1.5 mt-14">
          <div className="flex items-center gap-2">
            {state.isRecording && (
              <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/50 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-bold text-red-300 tracking-wider">
                  REC
                </span>
              </div>
            )}

            <div className="bg-[#0A1012]/90 backdrop-blur-md border border-[rgba(92,225,230,0.18)] px-3 py-1 rounded-lg text-[11px] font-semibold text-[#829397] shadow-md">
              MODE: <span className="text-[#5CE1E6] font-bold">{state.mode}</span>
            </div>

            {/* Compact Clickable Portal type badge */}
            <button
              onClick={onCyclePortal}
              title="Click to cycle portal type (or press [ / ] or P)"
              className="bg-[#0A1012]/90 hover:bg-[#070B0D] border border-[rgba(92,225,230,0.18)] hover:border-[rgba(92,225,230,0.55)] px-3 py-1 rounded-lg text-[11px] font-semibold text-[#F5FFFF] shadow-md transition-all cursor-pointer flex items-center gap-1.5 pointer-events-auto"
            >
              <span className="text-[#829397]">PORTAL:</span>
              <span className={`${PORTAL_TYPE_COLORS[state.portalType] ?? 'text-white'} font-bold`}>
                {state.portalType === 'NEON' ? 'STRANGE' : state.portalType === 'SYMBOL_OF_LOVE' ? 'SYMBOL OF LOVE' : state.portalType}
              </span>
              <span className="text-[9px] text-[#829397]">↻</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar: Quick Mode Buttons & Shortcuts */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Gesture charge indicators */}
        {state.gesture === 'PINCH' && state.portalHoldTime > 0 && state.portalHoldTime < 10 && (
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="text-[11px] tracking-widest text-[#5CE1E6] font-bold uppercase">
              🌀 Hold to Open Portal — {state.portalType}
            </div>
            <div className="w-44 h-1.5 bg-[rgba(92,225,230,0.18)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1597A3] to-[#5CE1E6] rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, (state.portalHoldTime / 0.25) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Portal & Smile CLOSE charge bar */}
        {state.gesture === 'THREE_FINGERS' && state.portalCloseHoldTime > 0 && state.portalCloseHoldTime < 10 && (state.portalActive || state.auroraActive) && (
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="text-[11px] tracking-widest text-rose-300 font-bold uppercase">
              3️⃣ Hold 3 Fingers to Close Effects
            </div>
            <div className="w-44 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, (state.portalCloseHoldTime / 0.5) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* SMILE spell charge bar */}
        {state.gesture === 'TWO_FINGERS' && state.auroraHoldTime > 0 && !state.auroraActive && (
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="text-[11px] tracking-widest text-[#5CE1E6] font-bold uppercase">
              ✨ Hold Two Fingers for SMILE 🙂
            </div>
            <div className="w-44 h-1.5 bg-[rgba(92,225,230,0.18)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1597A3] to-[#5CE1E6] rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, (state.auroraHoldTime / 2.0) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* FIST Gravity Storm charge bar */}
        {state.gesture === 'FIST' && state.fistHoldTime > 0 && !state.fistActive && (
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="text-[11px] tracking-widest text-[#5CE1E6] font-bold uppercase">
              ✊ Hold Fist for Gravity Storm
            </div>
            <div className="w-44 h-1.5 bg-[rgba(92,225,230,0.18)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1597A3] to-[#5CE1E6] rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, (state.fistHoldTime / 0.4) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Mode Selector & Clear Button */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#0b090a]/90 backdrop-blur-lg border border-[rgba(235,242,250,0.15)] p-1.5 rounded-2xl shadow-2xl">
          {(['PEN', 'PARTICLE', 'ENERGY', 'FIRE', 'GALAXY'] as DrawingMode[]).map(
            (m, idx) => (
              <button
                key={m}
                onClick={() => onSelectMode(m)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${state.mode === m
                  ? 'bg-[#ebf2fa] text-[#0b090a] shadow-[0_0_15px_rgba(235,242,250,0.3)] scale-105'
                  : 'text-[#ebf2fa]/60 hover:text-[#ebf2fa] hover:bg-white/5'
                  }`}
              >
                <span className="opacity-40 mr-1.5">{idx + 1}</span>
                {m}
              </button>
            )
          )}
          <div className="h-4 w-px bg-[rgba(235,242,250,0.15)] mx-1" />
          <button
            id="btn-smile-spell"
            onClick={() => {
              if (onToggleSmile) {
                onToggleSmile();
              } else {
                const eff = (window as any).airMagicEngine?.effectsManager;
                const airState = (window as any).airMagicState;
                if (eff) {
                  if (eff.isSmileActive()) {
                    eff.stopSmile();
                    if (airState) airState.auroraActive = false;
                  } else {
                    eff.triggerSmile({ x: 0, y: 0, z: 0 }, 6.0);
                    if (airState) airState.auroraActive = true;
                  }
                }
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${state.auroraActive
                ? 'bg-[#ebf2fa] text-[#0b090a] shadow-[0_0_12px_rgba(235,242,250,0.3)]'
                : 'text-[#ebf2fa] hover:bg-white/10 border border-[rgba(235,242,250,0.20)]'
              }`}
            title="Toggle Smile Spell (S / ✌️ / Click to Close)"
          >
            <span>{state.auroraActive ? '✕' : '✨'}</span>
            <span>{state.auroraActive ? 'CLOSE 🙂' : 'SMILE 🙂'}</span>
          </button>
          <div className="h-4 w-px bg-[rgba(235,242,250,0.15)] mx-1" />
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#ebf2fa]/60 hover:text-red-400 hover:bg-red-950/30 transition-all cursor-pointer"
            title="Clear all particles and trails (Space)"
          >
            CLEAR
          </button>
        </div>

        {/* Keyboard Helper */}
        <div className="flex items-center gap-3 text-[11px] text-[#ebf2fa]/50 bg-[#0b090a]/85 backdrop-blur-sm px-4 py-1.5 rounded-full border border-[rgba(235,242,250,0.15)]">
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">1-5</kbd> Modes</span>
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">P</kbd> Portal</span>
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">S / ✌️</kbd> Smile (Toggle)</span>
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">3️⃣</kbd> Close</span>
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">G</kbd> Flowers</span>
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">B</kbd> Butterflies</span>
          <span><kbd className="bg-[rgba(235,242,250,0.1)] px-1.5 py-0.5 rounded text-[#ebf2fa] text-[10px] font-mono border border-[rgba(235,242,250,0.15)]">Space</kbd> Clear</span>
        </div>
      </div>
    </div>
  );
};

