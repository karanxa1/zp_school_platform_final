import React from "react";

export default function Noise() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 mix-blend-soft-light opacity-40">
      <svg className="h-full w-full">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch">
            <animate
              attributeName="baseFrequency"
              dur="30s"
              values="0.8;0.6;0.9;0.7;0.8"
              repeatCount="indefinite"
            />
          </feTurbulence>
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

