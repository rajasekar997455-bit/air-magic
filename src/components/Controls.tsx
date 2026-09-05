import React from 'react';
import { Camera, Volume2, VolumeX, Disc, Maximize, Play } from 'lucide-react';
import type { PerformanceTier } from '../types';

interface ControlsProps {
  cameraVisible: boolean;
  audioEnabled: boolean;
  isRecording: boolean;
  isDemoMode: boolean;
  butterfliesActive?: boolean;
  flowersActive?: boolean;
  flowersEnabled?: boolean;
  tier: PerformanceTier;
  onToggleCamera: () => void;
  onToggleAudio: () => void;
  onToggleRecording: () => void;
  onToggleFullscreen: () => void;
  onToggleDemo: () => void;
  onToggleButterflies?: () => void;
  onToggleFlowers?: () => void;
  onSpawnFlower?: () => void;
  onClearFlowers?: () => void;
  onSetTier: (tier: PerformanceTier) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  cameraVisible,
  audioEnabled,
  isRecording,
  isDemoMode,
  butterfliesActive = false,
  flowersActive = false,
  flowersEnabled = false,
  tier,
  onToggleCamera,
  onToggleAudio,
  onToggleRecording,
  onToggleFullscreen,
  onToggleDemo,
  onToggleButterflies,
  onToggleFlowers,
  onSpawnFlower,
  onClearFlowers,
  onSetTier,
}) => {
  return (
    <div className="fixed top-6 right-6 z-40 flex items-center gap-2 pointer-events-auto">
      {/* Tier Selector */}
      <div className="flex bg-[#0A1012]/90 backdrop-blur-md border border-[rgba(92,225,230,0.18)] p-1 rounded-xl">
        {(['LOW', 'MEDIUM', 'HIGH'] as PerformanceTier[]).map((t) => (
          <button
            key={t}
            onClick={() => onSetTier(t)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${tier === t
              ? 'bg-[#5CE1E6]/20 border border-[#5CE1E6]/50 text-[#5CE1E6]'
              : 'text-[#829397] hover:text-[#F5FFFF]'
              }`}
          >
            {t[0]}
          </button>
        ))}
      </div>

      {/* Holographic Butterfly Swarm Toggle */}
      {onToggleButterflies && (
        <button
          onClick={onToggleButterflies}
          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center justify-center text-sm ${butterfliesActive
            ? 'bg-[#5CE1E6]/20 border-[#5CE1E6]/50 text-[#5CE1E6] shadow-[0_0_12px_rgba(92,225,230,0.25)] scale-105'
            : 'bg-[#0A1012]/90 border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:bg-white/5'
            }`}
          title="Summon / Dismiss Holographic Butterflies (B)"
        >
          <span className="leading-none select-none">🦋</span>
        </button>
      )}

      {/* 🌸 Flower Mode Toggle Button (Strict OFF / ON) */}
      {onToggleFlowers && (
        <button
          onClick={onToggleFlowers}
          className={`px-3 py-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${flowersEnabled
              ? 'bg-[#5CE1E6]/20 border-[#5CE1E6]/50 text-[#5CE1E6] shadow-[0_0_15px_rgba(92,225,230,0.25)] scale-105'
              : 'bg-[#0A1012]/90 border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:border-[rgba(92,225,230,0.35)]'
            }`}
          title="Toggle Flower Mode (G)"
        >
          <span className={flowersEnabled ? 'animate-pulse' : 'grayscale opacity-60'}>🌸</span>
          <span className="tracking-wider">
            {flowersEnabled ? 'FLOWERS: ON' : 'FLOWERS: OFF'}
          </span>
        </button>
      )}

      {/* Sprout Holographic Blooming Flower */}
      {flowersEnabled && onSpawnFlower && (
        <button
          onClick={onSpawnFlower}
          className="p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center justify-center text-xs bg-[#0A1012]/90 border-[#5CE1E6]/30 text-[#5CE1E6] hover:bg-[#5CE1E6]/10 hover:border-[#5CE1E6]/50 shadow-[0_0_10px_rgba(92,225,230,0.2)]"
          title="Sprout Holographic Blooming Flower (F or 🤌 Flower Bud)"
        >
          <span className="leading-none select-none font-bold">＋🌸</span>
        </button>
      )}

      {/* Cancel / Clear All Flowers */}
      {flowersEnabled && flowersActive && onClearFlowers && (
        <button
          onClick={onClearFlowers}
          className="p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center justify-center text-xs bg-red-950/60 border-red-500/40 text-red-300 hover:text-white hover:bg-red-900/40"
          title="Clear All Flowers (Space)"
        >
          <span className="leading-none select-none font-bold">✕🌸</span>
        </button>
      )}

      {/* Demo Mode Toggle */}
      <button
        onClick={onToggleDemo}
        className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${isDemoMode
          ? 'bg-[#5CE1E6]/20 border-[#5CE1E6]/50 text-[#5CE1E6] shadow-[0_0_12px_rgba(92,225,230,0.25)]'
          : 'bg-[#0A1012]/90 border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:bg-white/5'
          }`}
        title="Toggle Demo Mode"
      >
        <Play size={16} />
      </button>

      {/* Camera Feed Toggle */}
      <button
        onClick={onToggleCamera}
        className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${cameraVisible
          ? 'bg-[#5CE1E6]/20 border-[#5CE1E6]/50 text-[#5CE1E6]'
          : 'bg-[#0A1012]/90 border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:bg-white/5'
          }`}
        title="Toggle Camera Feed (C)"
      >
        <Camera size={16} />
      </button>

      {/* Audio Mute Toggle */}
      <button
        onClick={onToggleAudio}
        className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${audioEnabled
          ? 'bg-[#5CE1E6]/20 border-[#5CE1E6]/50 text-[#5CE1E6]'
          : 'bg-[#0A1012]/90 border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:bg-white/5'
          }`}
        title="Toggle Audio (M)"
      >
        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* Canvas Video Recording */}
      <button
        onClick={onToggleRecording}
        className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${isRecording
          ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
          : 'bg-[#0A1012]/90 border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:bg-white/5'
          }`}
        title="Record Screen (R)"
      >
        <Disc size={16} />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={onToggleFullscreen}
        className="p-2.5 rounded-xl bg-[#0A1012]/90 border border-[rgba(92,225,230,0.18)] text-[#829397] hover:text-[#F5FFFF] hover:bg-white/5 backdrop-blur-md transition-all cursor-pointer"
        title="Toggle Fullscreen (F)"
      >
        <Maximize size={16} />
      </button>
    </div>
  );
};
