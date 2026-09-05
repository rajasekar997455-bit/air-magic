import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isVisible: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef, isVisible }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-opacity duration-700 z-0 overflow-hidden ${isVisible ? 'opacity-40' : 'opacity-0'
        }`}
    >
      <video
        ref={videoRef as any}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100 filter brightness-95 contrast-110 saturate-110"
      />
      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0b090a]/40 to-[#0b090a]" />
    </div>
  );
};
