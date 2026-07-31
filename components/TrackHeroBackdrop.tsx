"use client";

export default function TrackHeroBackdrop() {
  return (
    <svg
      className="hero-track"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050a12" />
          <stop offset="35%" stopColor="#0a1524" />
          <stop offset="70%" stopColor="#0c2430" />
          <stop offset="100%" stopColor="#0a3a2c" />
        </linearGradient>
        <radialGradient id="moonGlow" cx="78%" cy="18%" r="28%">
          <stop offset="0%" stopColor="#e8dcc8" stopOpacity="0.2" />
          <stop offset="45%" stopColor="#e8b84a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#e8b84a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="floodBloom" cx="50%" cy="28%" r="55%">
          <stop offset="0%" stopColor="#f0d78c" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#e8b84a" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#e8b84a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="turfDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#127a52" />
          <stop offset="40%" stopColor="#0c5a3c" />
          <stop offset="100%" stopColor="#063022" />
        </linearGradient>
        <linearGradient id="dirtLane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6e52" />
          <stop offset="50%" stopColor="#6b5340" />
          <stop offset="100%" stopColor="#4a382c" />
        </linearGradient>
        <linearGradient id="railBrass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#f0d78c" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="standFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#121a24" />
          <stop offset="100%" stopColor="#070c12" />
        </linearGradient>
        <linearGradient id="beam" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#f0d78c" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f0d78c" stopOpacity="0" />
        </linearGradient>
        <pattern
          id="turfGrain"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 8 L4 0 M4 8 L8 0"
            stroke="#0a2e20"
            strokeWidth="0.6"
            opacity="0.35"
          />
        </pattern>
        <filter id="softBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="1440" height="900" fill="url(#skyNight)" />
      <ellipse cx="1120" cy="140" rx="320" ry="180" fill="url(#moonGlow)" />
      <ellipse cx="720" cy="220" rx="780" ry="320" fill="url(#floodBloom)" />

      {/* Stars */}
      <g className="stars" fill="#e8e2d6">
        <circle className="star s1" cx="120" cy="60" r="1.2" />
        <circle className="star s2" cx="280" cy="110" r="0.9" />
        <circle className="star s3" cx="420" cy="48" r="1.4" />
        <circle className="star s1" cx="560" cy="90" r="0.8" />
        <circle className="star s2" cx="900" cy="55" r="1.1" />
        <circle className="star s3" cx="1040" cy="100" r="0.7" />
        <circle className="star s1" cx="1280" cy="70" r="1.3" />
        <circle className="star s2" cx="1360" cy="120" r="0.9" />
        <circle className="star s3" cx="200" cy="160" r="0.6" />
        <circle className="star s1" cx="760" cy="40" r="1" />
      </g>

      {/* Distant hills / tree line */}
      <path
        d="M0 360 C180 330 320 350 480 335 C640 320 780 345 960 330 C1140 315 1300 340 1440 325 L1440 420 L0 420 Z"
        fill="#061018"
        opacity="0.7"
      />

      {/* Grandstand — left */}
      <g className="grandstand">
        <path
          d="M0 280 L40 250 L220 250 L260 280 L260 420 L0 420 Z"
          fill="url(#standFace)"
        />
        <path
          d="M40 250 L40 235 L220 235 L220 250"
          fill="#1a2430"
        />
        {/* seating tiers */}
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M20 ${300 + i * 18} L240 ${300 + i * 18}`}
            stroke="#e8b84a"
            strokeWidth="1"
            opacity={0.12 + i * 0.03}
          />
        ))}
        {/* windows */}
        {[55, 95, 135, 175].map((x) => (
          <rect
            key={x}
            className="stand-window"
            x={x}
            y="262"
            width="18"
            height="12"
            fill="#e8b84a"
            opacity="0.35"
          />
        ))}
      </g>

      {/* Grandstand — right */}
      <g className="grandstand">
        <path
          d="M1180 280 L1220 245 L1420 245 L1440 270 L1440 420 L1180 420 Z"
          fill="url(#standFace)"
        />
        <path d="M1220 245 L1220 228 L1420 228 L1420 245" fill="#1a2430" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M1200 ${300 + i * 18} L1430 ${300 + i * 18}`}
            stroke="#e8b84a"
            strokeWidth="1"
            opacity={0.12 + i * 0.03}
          />
        ))}
        {[1245, 1285, 1325, 1365].map((x) => (
          <rect
            key={x}
            className="stand-window"
            x={x}
            y="258"
            width="18"
            height="12"
            fill="#e8b84a"
            opacity="0.32"
          />
        ))}
      </g>

      {/* Center tote / clubhouse silhouette */}
      <g opacity="0.85">
        <rect x="560" y="210" width="320" height="180" fill="#080e16" />
        <path d="M540 210 L720 160 L900 210 Z" fill="#0e1620" />
        <rect x="680" y="175" width="80" height="35" fill="#121c28" />
        {/* tote digits glow */}
        <g className="tote-glow" filter="url(#softBloom)">
          <rect x="590" y="240" width="40" height="22" rx="2" fill="#e8b84a" opacity="0.4" />
          <rect x="645" y="240" width="40" height="22" rx="2" fill="#e8b84a" opacity="0.28" />
          <rect x="700" y="240" width="40" height="22" rx="2" fill="#e8b84a" opacity="0.45" />
          <rect x="755" y="240" width="40" height="22" rx="2" fill="#e8b84a" opacity="0.3" />
          <rect x="810" y="240" width="40" height="22" rx="2" fill="#e8b84a" opacity="0.38" />
        </g>
        <text
          x="720"
          y="320"
          textAnchor="middle"
          fill="#e8b84a"
          opacity="0.55"
          fontFamily="Georgia, serif"
          fontSize="22"
          letterSpacing="6"
        >
          JOCKEY
        </text>
      </g>

      {/* Floodlight poles + beams */}
      <g className="stadium-lights">
        {[160, 400, 1040, 1280].map((x, i) => (
          <g key={x}>
            <rect x={x - 4} y="170" width="8" height="100" fill="#15202c" />
            <rect x={x - 22} y="168" width="44" height="8" rx="1" fill="#1c2836" />
            <circle
              className="light-bulb"
              cx={x}
              cy="172"
              r="7"
              fill="#f0d78c"
              filter="url(#softBloom)"
            />
            <path
              className={`light-beam beam-${i}`}
              d={`M${x - 50} 180 L${x + 50} 180 L${x + 160} 520 L${x - 160} 520 Z`}
              fill="url(#beam)"
              opacity="0.45"
            />
          </g>
        ))}
      </g>

      {/* Turf infield */}
      <path
        d="M0 400 C360 360 720 380 1080 365 S1440 400 1440 400 L1440 900 L0 900 Z"
        fill="url(#turfDeep)"
      />
      <path
        d="M0 400 C360 360 720 380 1080 365 S1440 400 1440 400 L1440 900 L0 900 Z"
        fill="url(#turfGrain)"
        opacity="0.4"
      />

      {/* Dirt oval / stretch */}
      <path
        className="dirt-lane"
        d="M0 520
           C280 475 560 490 800 485
           C1040 480 1280 500 1440 520
           L1440 655
           C1200 680 960 670 720 665
           C480 660 220 675 0 655 Z"
        fill="url(#dirtLane)"
      />
      {/* lane stripe */}
      <path
        d="M0 575 C360 540 720 555 1080 545 S1440 575 1440 575"
        fill="none"
        stroke="#d4c4a8"
        strokeWidth="1.5"
        strokeDasharray="18 14"
        opacity="0.35"
      />

      {/* Inner rail */}
      <path
        d="M0 518 C400 475 800 490 1440 518"
        fill="none"
        stroke="url(#railBrass)"
        strokeWidth="3.5"
      />
      {/* Outer rail */}
      <path
        d="M0 652 C400 678 800 668 1440 652"
        fill="none"
        stroke="url(#railBrass)"
        strokeWidth="2.5"
        opacity="0.7"
      />

      {/* Rail posts */}
      {Array.from({ length: 18 }, (_, i) => {
        const t = i / 17;
        const x = t * 1440;
        const yTop = 518 + Math.sin(t * Math.PI) * -28;
        return (
          <rect
            key={i}
            x={x - 2}
            y={yTop}
            width="4"
            height="16"
            fill="#c9a227"
            opacity="0.55"
          />
        );
      })}

      {/* Finish post */}
      <g className="finish-post">
        <rect x="1088" y="430" width="8" height="200" fill="#e8e2d6" opacity="0.85" />
        <rect x="1075" y="430" width="34" height="14" fill="#c41e3a" />
        <rect x="1075" y="444" width="34" height="14" fill="#e8e2d6" />
        <rect x="1075" y="458" width="34" height="14" fill="#c41e3a" />
      </g>

      {/* Atmosphere mist */}
      <g className="mist-band" opacity="0.1">
        <ellipse cx="240" cy="590" rx="200" ry="22" fill="#f5f0e8" />
        <ellipse cx="780" cy="610" rx="260" ry="26" fill="#f5f0e8" />
        <ellipse cx="1240" cy="580" rx="180" ry="20" fill="#f5f0e8" />
      </g>

      {/* Distant field — proper galloping silhouettes */}
      <g className="silhouettes" fill="#050b12" opacity="0.32">
        <g className="sil sil-1">
          <path d="M90 545
            C98 528 118 522 138 528
            C148 520 158 524 162 532
            L168 548 L158 552 L148 546
            C140 560 128 568 118 560
            C108 568 98 560 96 548 Z" />
          <circle cx="150" cy="518" r="5" />
          <path d="M142 522 L130 512 L138 522" />
        </g>
        <g className="sil sil-2">
          <path d="M320 538
            C330 520 352 514 374 522
            C386 512 398 518 402 528
            L410 546 L398 550 L386 542
            C376 558 362 566 350 556
            C338 564 326 556 324 542 Z" />
          <circle cx="388" cy="510" r="5.5" />
        </g>
        <g className="sil sil-3">
          <path d="M980 542
            C992 524 1016 518 1040 526
            C1052 516 1066 522 1070 532
            L1078 550 L1066 554 L1054 546
            C1042 562 1026 568 1014 558
            C1000 566 986 558 984 546 Z" />
          <circle cx="1054" cy="514" r="5" />
        </g>
      </g>
    </svg>
  );
}
