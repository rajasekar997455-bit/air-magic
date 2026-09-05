import React, { useState, useEffect } from 'react';
import type { SharedInteractionState } from '../types';

interface DebugPanelProps {
  state: SharedInteractionState;
  isVisible: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ state, isVisible }) => {
  const [, setTick] = useState(0);

  // Poll state at 10Hz for debug display to avoid React render churn
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-6 z-50 bg-[#0A1012]/90 backdrop-blur-md border border-[rgba(92,225,230,0.18)] rounded-xl p-4 text-xs font-mono text-[#F5FFFF] shadow-[0_0_25px_rgba(0,0,0,0.7)] min-w-[240px] pointer-events-none select-none">
      <div className="flex items-center justify-between border-b border-[rgba(92,225,230,0.18)] pb-2 mb-3">
        <span className="font-bold tracking-widest text-[#5CE1E6]">TELEMETRY</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#5CE1E6]/10 border border-[#5CE1E6]/30 text-[#5CE1E6]">
          {state.tier}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-[#829397]">FPS:</span>
          <span className={`font-bold ${state.fps >= 55 ? 'text-[#5CE1E6]' : state.fps >= 35 ? 'text-amber-400' : 'text-red-400'}`}>
            {state.fps}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Frame Time:</span>
          <span>{state.frameTime} ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Render Time:</span>
          <span>{state.renderTime.toFixed(1)} ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Vision Latency:</span>
          <span>{state.trackingLatency.toFixed(1)} ms</span>
        </div>

        <div className="border-t border-[rgba(92,225,230,0.18)] my-1.5 pt-1.5"></div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Hand:</span>
          <span className={state.handDetected ? 'text-[#5CE1E6]' : 'text-red-400'}>
            {state.handDetected ? 'DETECTED' : 'SEARCHING'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Confidence:</span>
          <span>{(state.confidence * 100).toFixed(0)}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Gesture:</span>
          <span className="font-bold text-[#5CE1E6]">{state.gesture}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Drawing:</span>
          <span className={state.isDrawing ? 'text-[#5CE1E6]' : 'text-[#829397]'}>
            {state.isDrawing ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#829397]">Particles:</span>
          <span className="font-bold text-[#F5FFFF]">{state.particleCount}</span>
        </div>
      </div>
    </div>
  );
};
