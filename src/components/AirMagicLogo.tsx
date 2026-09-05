import React from 'react';

export const AirMagicLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="AIR MAGIC logo"
    >
      {/* Outer spatial orbital boundary with precision tick marks */}
      <circle
        cx="24"
        cy="24"
        r="21.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.25"
      />
      {/* 4 Cardinal spatial alignment nodes */}
      <circle cx="24" cy="2.5" r="1" fill="#D6FF3F" fillOpacity="0.6" />
      <circle cx="45.5" cy="24" r="1" fill="#D6FF3F" fillOpacity="0.6" />
      <circle cx="24" cy="45.5" r="1" fill="#D6FF3F" fillOpacity="0.6" />
      <circle cx="2.5" cy="24" r="1" fill="#D6FF3F" fillOpacity="0.6" />

      {/* Primary hand motion trajectory curve */}
      <path
        d="M 13 32 C 17 21, 26 15, 35 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      {/* Secondary spatial wave arc */}
      <path
        d="M 15 22 C 22 28, 30 29, 36 22"
        stroke="#D6FF3F"
        strokeWidth="1.2"
        strokeDasharray="2.5 3"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />

      {/* Central energy nexus pulse ring */}
      <circle
        cx="24"
        cy="24"
        r="5.5"
        stroke="#D6FF3F"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      {/* Central energy point */}
      <circle cx="24" cy="24" r="2.2" fill="#D6FF3F" />
    </svg>
  );
};

export default AirMagicLogo;
