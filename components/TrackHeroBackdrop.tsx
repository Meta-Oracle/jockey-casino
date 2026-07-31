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
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="45%" stopColor="#0d1f2d" />
          <stop offset="100%" stopColor="#0a3d2e" />
        </linearGradient>
        <linearGradient id="turfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f5c40" />
          <stop offset="100%" stopColor="#083528" />
        </linearGradient>
        <radialGradient id="flood" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#e8b84a" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#e8b84a" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#e8b84a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="railGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#e8b84a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#skyGrad)" />
      <ellipse cx="720" cy="180" rx="700" ry="280" fill="url(#flood)" />

      {/* Stadium silhouettes */}
      <g opacity="0.35">
        <path
          d="M0 320 L80 280 L160 320 L240 260 L320 320 L400 270 L480 320 L560 255 L640 320 L720 250 L800 320 L880 265 L960 320 L1040 270 L1120 320 L1200 260 L1280 320 L1360 275 L1440 320 L1440 420 L0 420 Z"
          fill="#050b12"
        />
        <g className="stadium-lights">
          {[120, 360, 600, 840, 1080, 1320].map((x) => (
            <g key={x}>
              <rect x={x - 3} y="200" width="6" height="70" fill="#1a2430" />
              <circle className="light-bulb" cx={x} cy="198" r="10" fill="#e8b84a" />
            </g>
          ))}
        </g>
      </g>

      {/* Turf */}
      <path
        d="M0 420 Q360 380 720 400 T1440 420 L1440 900 L0 900 Z"
        fill="url(#turfGrad)"
      />

      {/* Dirt lane */}
      <path
        className="dirt-lane"
        d="M0 560 Q360 520 720 540 T1440 560 L1440 680 Q1080 700 720 680 T0 680 Z"
        fill="#6b5344"
        opacity="0.55"
      />

      {/* Rails */}
      <path
        d="M0 555 Q720 520 1440 555"
        fill="none"
        stroke="url(#railGrad)"
        strokeWidth="3"
      />
      <path
        d="M0 675 Q720 700 1440 675"
        fill="none"
        stroke="url(#railGrad)"
        strokeWidth="2"
        opacity="0.6"
      />

      {/* Moving dust / mist bands */}
      <g className="mist-band" opacity="0.12">
        <ellipse cx="200" cy="600" rx="180" ry="20" fill="#f5f0e8" />
        <ellipse cx="900" cy="620" rx="220" ry="24" fill="#f5f0e8" />
        <ellipse cx="1300" cy="590" rx="160" ry="18" fill="#f5f0e8" />
      </g>

      {/* Distant galloping silhouettes */}
      <g className="silhouettes" opacity="0.25">
        <path
          className="sil sil-1"
          d="M80 540 Q100 520 130 525 L145 555 L120 560 L95 555 Z"
          fill="#050b12"
        />
        <path
          className="sil sil-2"
          d="M280 535 Q305 512 340 520 L355 550 L325 555 L295 548 Z"
          fill="#050b12"
        />
        <path
          className="sil sil-3"
          d="M1100 545 Q1130 520 1170 528 L1185 558 L1150 562 L1120 555 Z"
          fill="#050b12"
        />
      </g>
    </svg>
  );
}
