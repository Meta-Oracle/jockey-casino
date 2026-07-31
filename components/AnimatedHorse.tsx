"use client";

import type { HorseConfig, ManeStyle } from "@/lib/game";

interface Props {
  horse: HorseConfig;
  className?: string;
  racing?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
}

function manePath(style: ManeStyle): string {
  switch (style) {
    case "braided":
      return "M72 78 Q78 90 76 108 Q74 118 78 128";
    case "cropped":
      return "M72 78 L78 92 L74 98";
    case "wild":
      return "M70 76 Q85 88 68 100 Q90 110 72 125 Q88 132 76 140";
    default:
      return "M72 78 Q88 95 82 120 Q78 140 86 155";
  }
}

const sizes = {
  sm: 160,
  md: 280,
  lg: 420,
  hero: 720,
};

export default function AnimatedHorse({
  horse,
  className = "",
  racing = false,
  size = "md",
}: Props) {
  const w = sizes[size];
  const h = Math.round(w * 0.62);
  const coat = horse.coat;
  const silkA = horse.silkPrimary;
  const silkB = horse.silkSecondary;
  const spotted = horse.breedId === "appaloosa";

  return (
    <svg
      className={`horse-svg ${racing ? "is-racing" : ""} ${className}`}
      width={w}
      height={h}
      viewBox="0 0 360 220"
      role="img"
      aria-label={`${horse.name}, ${horse.breedId} racehorse`}
    >
      <defs>
        <linearGradient id="trackFog" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d6b4c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#071018" stopOpacity="0" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern
          id="appaloosaSpots"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="4" r="2.2" fill="#1a120c" opacity="0.55" />
          <circle cx="10" cy="10" r="1.8" fill="#1a120c" opacity="0.4" />
        </pattern>
      </defs>

      {/* Ground shadow */}
      <ellipse
        className="horse-shadow"
        cx="190"
        cy="200"
        rx="110"
        ry="10"
        fill="#000"
        opacity="0.35"
      />

      <g className="horse-body-group">
        {/* Hind legs */}
        <g className="leg hind-back">
          <path
            d="M230 130 L242 175 L238 198"
            fill="none"
            stroke={coat}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M236 198 L248 198"
            stroke="#1a120c"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g className="leg hind-front">
          <path
            d="M210 128 L200 172 L204 198"
            fill="none"
            stroke={coat}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M198 198 L210 198"
            stroke="#1a120c"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Body */}
        <ellipse
          cx="175"
          cy="118"
          rx="78"
          ry="38"
          fill={coat}
          filter="url(#softGlow)"
        />
        {spotted && (
          <ellipse
            cx="175"
            cy="118"
            rx="78"
            ry="38"
            fill="url(#appaloosaSpots)"
            opacity="0.85"
          />
        )}

        {/* Neck */}
        <path
          d="M110 105 Q95 80 78 72 Q88 100 100 118 Z"
          fill={coat}
        />

        {/* Head */}
        <g className="horse-head">
          <ellipse cx="62" cy="68" rx="22" ry="14" fill={coat} />
          <ellipse cx="48" cy="72" rx="12" ry="8" fill={coat} />
          <circle cx="54" cy="64" r="3" fill="#0a0a0a" />
          <ellipse cx="40" cy="74" rx="3" ry="2" fill="#2a1810" />
          <path
            className="ear"
            d="M70 56 L74 42 L66 54 Z"
            fill={coat}
          />
          <path d="M78 58 L84 46 L76 56 Z" fill={coat} />
        </g>

        {/* Mane */}
        <path
          className="mane"
          d={manePath(horse.mane)}
          fill="none"
          stroke="#1a120c"
          strokeWidth={horse.mane === "cropped" ? 6 : 9}
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Tail */}
        <path
          className="tail"
          d="M250 105 Q280 90 275 140 Q270 165 255 150"
          fill="none"
          stroke="#1a120c"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Front legs */}
        <g className="leg fore-back">
          <path
            d="M140 135 L128 175 L132 198"
            fill="none"
            stroke={coat}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M126 198 L138 198"
            stroke="#1a120c"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g className="leg fore-front">
          <path
            d="M155 138 L162 178 L158 198"
            fill="none"
            stroke={coat}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M152 198 L164 198"
            stroke="#1a120c"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Jockey */}
        <g className="jockey">
          <ellipse cx="155" cy="88" rx="16" ry="12" fill={silkA} />
          <path d="M142 88 L148 70 L162 70 L168 88 Z" fill={silkB} />
          <circle cx="155" cy="62" r="9" fill="#e8c4a0" />
          <path d="M146 58 Q155 48 164 58" fill={silkA} />
          <path
            d="M148 95 L140 118"
            stroke={silkA}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M162 95 L170 118"
            stroke={silkA}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Saddle blanket stripe */}
        <rect
          x="148"
          y="100"
          width="36"
          height="10"
          rx="2"
          fill={silkB}
          opacity="0.85"
        />
      </g>

      {/* Motion dust when racing */}
      {racing && (
        <g className="dust" opacity="0.5">
          <circle className="dust-p" cx="250" cy="195" r="3" fill="#c4a574" />
          <circle className="dust-p d2" cx="270" cy="198" r="2" fill="#c4a574" />
          <circle className="dust-p d3" cx="290" cy="196" r="2.5" fill="#c4a574" />
        </g>
      )}
    </svg>
  );
}
