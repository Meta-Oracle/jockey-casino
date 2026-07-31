"use client";

import { useId } from "react";
import type { BreedId, HorseConfig, ManeStyle } from "@/lib/game";

interface Props {
  horse: HorseConfig;
  className?: string;
  racing?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
}

const sizes = {
  sm: 180,
  md: 320,
  lg: 460,
  hero: 780,
};

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function Mane({
  style,
  dark,
  mid,
}: {
  style: ManeStyle;
  dark: string;
  mid: string;
}) {
  if (style === "cropped") {
    return (
      <g className="mane">
        <path d="M118 78 L124 58 L130 76 Z" fill={dark} />
        <path d="M128 76 L136 54 L140 74 Z" fill={mid} />
        <path d="M138 78 L148 60 L150 80 Z" fill={dark} />
      </g>
    );
  }
  if (style === "braided") {
    return (
      <g className="mane">
        <path
          d="M122 72 C128 88 124 104 130 118 C126 132 134 146 128 160"
          fill="none"
          stroke={dark}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M128 74 C134 90 130 106 136 120 C132 134 140 148 134 162"
          fill="none"
          stroke={mid}
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle cx="126" cy="92" r="2.2" fill={mid} />
        <circle cx="130" cy="112" r="2.2" fill={mid} />
        <circle cx="128" cy="132" r="2.2" fill={mid} />
        <circle cx="132" cy="150" r="2.2" fill={mid} />
      </g>
    );
  }
  if (style === "wild") {
    return (
      <g className="mane">
        <path
          d="M120 70 C138 82 118 98 142 108 C116 118 140 132 122 148 C146 156 124 168 136 178"
          fill="none"
          stroke={dark}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M126 68 C150 86 128 102 152 118 C124 128 148 144 130 160"
          fill="none"
          stroke={mid}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M132 72 C146 90 134 110 144 130"
          fill="none"
          stroke={dark}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    );
  }
  /* flowing */
  return (
    <g className="mane">
      <path
        d="M118 68 C136 78 132 108 142 138 C148 158 138 176 150 188"
        fill="none"
        stroke={dark}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M124 70 C140 84 138 112 146 142 C150 162 144 178 154 190"
        fill="none"
        stroke={mid}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M130 74 C142 92 140 120 148 148"
        fill="none"
        stroke={dark}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </g>
  );
}

function BreedMarks({
  breedId,
  coat,
  uid,
}: {
  breedId: BreedId;
  coat: string;
  uid: string;
}) {
  if (breedId === "appaloosa") {
    return (
      <g opacity="0.55">
        <ellipse cx="248" cy="128" rx="7" ry="5" fill="#1a120c" />
        <ellipse cx="268" cy="118" rx="5" ry="4" fill="#1a120c" />
        <ellipse cx="258" cy="142" rx="6" ry="4.5" fill="#1a120c" />
        <ellipse cx="280" cy="134" rx="4" ry="3.5" fill="#1a120c" />
        <ellipse cx="238" cy="148" rx="5" ry="3.5" fill="#1a120c" />
        <ellipse cx="272" cy="150" rx="3.5" ry="3" fill="#1a120c" />
        <ellipse cx="252" cy="108" rx="4" ry="3" fill="#1a120c" />
      </g>
    );
  }
  if (breedId === "frisian") {
    return (
      <ellipse
        cx="230"
        cy="120"
        rx="70"
        ry="32"
        fill={`url(#${uid}-sheen)`}
        opacity="0.35"
      />
    );
  }
  if (breedId === "arabian") {
    return (
      <path
        d="M168 96 Q175 88 182 96"
        fill="none"
        stroke={shade(coat, 40)}
        strokeWidth="1.5"
        opacity="0.5"
      />
    );
  }
  return null;
}

export default function AnimatedHorse({
  horse,
  className = "",
  racing = false,
  size = "md",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const w = sizes[size];
  const h = Math.round(w * 0.68);
  const coat = horse.coat;
  const coatDeep = shade(coat, -28);
  const coatLit = shade(coat, 36);
  const maneDark = shade(coat, -55) === coat ? "#120c08" : shade(coat, -55);
  const maneMid = shade(coat, -20);
  const silkA = horse.silkPrimary;
  const silkB = horse.silkSecondary;
  const skin = "#d4a574";

  return (
    <svg
      className={`horse-svg ${racing ? "is-racing" : ""} ${className}`}
      width={w}
      height={h}
      viewBox="0 0 420 280"
      role="img"
      aria-label={`${horse.name}, ${horse.breedId} racehorse`}
    >
      <defs>
        <linearGradient id={`${uid}-coat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={coatLit} />
          <stop offset="45%" stopColor={coat} />
          <stop offset="100%" stopColor={coatDeep} />
        </linearGradient>
        <linearGradient id={`${uid}-neck`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={coatLit} />
          <stop offset="100%" stopColor={coatDeep} />
        </linearGradient>
        <radialGradient id={`${uid}-sheen`} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-silk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={silkB} />
          <stop offset="42%" stopColor={silkB} />
          <stop offset="42%" stopColor={silkA} />
          <stop offset="100%" stopColor={silkA} />
        </linearGradient>
        <linearGradient id={`${uid}-boot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2218" />
          <stop offset="100%" stopColor="#0c0a08" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.35" />
        </filter>
        <clipPath id={`${uid}-bodyClip`}>
          <path d="M168 98
             C188 82 230 74 268 82
             C300 90 324 108 322 136
             C320 162 300 180 268 186
             C230 194 190 188 170 170
             C152 152 148 122 168 98 Z" />
        </clipPath>
      </defs>

      {/* Ground contact */}
      <ellipse
        className="horse-shadow"
        cx="230"
        cy="252"
        rx="118"
        ry="12"
        fill="#000"
        opacity="0.38"
      />

      <g className="horse-body-group" filter={`url(#${uid}-soft)`}>
        {/* ——— Tail (behind) ——— */}
        <g className="tail" style={{ transformOrigin: "308px 112px" }}>
          <path
            d="M304 108 C338 96 352 118 346 152 C342 176 328 188 318 172 C332 168 336 148 322 136 C314 128 308 122 304 112"
            fill={maneDark}
          />
          <path
            d="M308 114 C330 108 340 128 336 150 C334 164 326 172 320 162"
            fill={maneMid}
            opacity="0.55"
          />
        </g>

        {/* ——— Hind legs ——— */}
        <g className="leg hind-far" style={{ transformOrigin: "278px 150px" }}>
          <path
            d="M272 148 C286 168 292 196 286 228"
            fill="none"
            stroke={coatDeep}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M286 228 C288 242 284 252 290 252"
            fill="none"
            stroke={coatDeep}
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M282 252 L300 252"
            stroke="#1a120c"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        <g className="leg hind-near" style={{ transformOrigin: "256px 148px" }}>
          <path
            d="M248 146 C258 170 248 200 252 228"
            fill="none"
            stroke={`url(#${uid}-coat)`}
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M252 228 C250 242 254 252 248 252"
            fill="none"
            stroke={coat}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <ellipse cx="248" cy="252" rx="11" ry="4.5" fill="#140e0a" />
          {/* hock highlight */}
          <circle cx="252" cy="198" r="5" fill={coatLit} opacity="0.25" />
        </g>

        {/* ——— Barrel / body ——— */}
        <path
          d="M168 98
             C188 82 230 74 268 82
             C300 90 324 108 322 136
             C320 162 300 180 268 186
             C230 194 190 188 170 170
             C152 152 148 122 168 98 Z"
          fill={`url(#${uid}-coat)`}
        />
        <path
          d="M190 100 C230 88 280 92 304 118"
          fill="none"
          stroke={coatLit}
          strokeWidth="2"
          opacity="0.28"
        />
        <ellipse
          cx="220"
          cy="118"
          rx="55"
          ry="28"
          fill={`url(#${uid}-sheen)`}
          opacity="0.4"
        />
        <g clipPath={`url(#${uid}-bodyClip)`}>
          <BreedMarks breedId={horse.breedId} coat={coat} uid={uid} />
        </g>

        {/* ——— Chest / shoulder ——— */}
        <path
          d="M168 110 C158 128 162 158 178 172 C168 150 166 128 172 112 Z"
          fill={coatDeep}
          opacity="0.45"
        />

        {/* ——— Neck ——— */}
        <path
          d="M168 108
             C156 92 142 78 124 70
             C118 88 122 112 132 132
             C142 148 158 156 172 148
             C168 132 170 118 168 108 Z"
          fill={`url(#${uid}-neck)`}
        />
        <path
          d="M140 86 C148 100 152 120 148 138"
          fill="none"
          stroke={coatDeep}
          strokeWidth="3"
          opacity="0.35"
        />

        {/* ——— Head ——— */}
        <g className="horse-head" style={{ transformOrigin: "108px 78px" }}>
          {/* ears */}
          <path
            className="ear ear-far"
            d="M128 62 L134 38 L120 58 Z"
            fill={coatDeep}
          />
          <path
            className="ear ear-near"
            d="M138 64 L148 40 L134 60 Z"
            fill={coat}
          />
          <path d="M136 56 L144 44 L138 58" fill="#3a2418" opacity="0.5" />

          {/* skull + muzzle */}
          <path
            d="M118 70
               C128 58 148 58 152 72
               C156 82 152 92 144 96
               C132 102 118 100 112 92
               C106 84 108 76 118 70 Z"
            fill={`url(#${uid}-coat)`}
          />
          <path
            d="M112 88
               C104 90 94 92 86 90
               C80 88 78 84 82 80
               C90 74 104 78 112 84 Z"
            fill={coat}
          />
          <path
            d="M86 86 C82 88 80 90 84 92"
            fill="none"
            stroke={coatDeep}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* nostril */}
          <ellipse cx="84" cy="88" rx="2.2" ry="1.6" fill="#1a100c" />
          {/* eye */}
          <ellipse cx="128" cy="74" rx="4.2" ry="3.4" fill="#0a0806" />
          <circle cx="129.5" cy="73" r="1.3" fill="#f0e6d2" opacity="0.85" />
          {/* cheekbone */}
          <path
            d="M118 82 C124 86 132 86 138 82"
            fill="none"
            stroke={coatDeep}
            strokeWidth="1.5"
            opacity="0.35"
          />
          {/* blaze optional light */}
          <path
            d="M120 68 C116 78 110 86 102 90"
            fill="none"
            stroke={coatLit}
            strokeWidth="2"
            opacity="0.2"
          />

          {/* bridle */}
          <path
            d="M110 78 C118 70 136 70 144 80"
            fill="none"
            stroke="#1a120c"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M100 86 C112 94 130 94 142 88"
            fill="none"
            stroke="#1a120c"
            strokeWidth="2"
          />
          <path
            d="M90 86 L108 96"
            fill="none"
            stroke="#2a2218"
            strokeWidth="1.8"
          />
        </g>

        <Mane style={horse.mane} dark={maneDark} mid={maneMid} />

        {/* ——— Forelegs ——— */}
        <g className="leg fore-far" style={{ transformOrigin: "178px 158px" }}>
          <path
            d="M176 156 C168 182 162 210 166 232"
            fill="none"
            stroke={coatDeep}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M166 232 C164 244 168 252 162 252"
            fill="none"
            stroke={coatDeep}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M156 252 L172 252"
            stroke="#140e0a"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        </g>

        <g className="leg fore-near" style={{ transformOrigin: "198px 160px" }}>
          <path
            d="M192 158 C200 186 204 214 198 234"
            fill="none"
            stroke={`url(#${uid}-coat)`}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M198 234 C200 244 196 252 202 252"
            fill="none"
            stroke={coat}
            strokeWidth="11"
            strokeLinecap="round"
          />
          <ellipse cx="202" cy="252" rx="10" ry="4.5" fill="#140e0a" />
          <circle cx="198" cy="200" r="4.5" fill={coatLit} opacity="0.22" />
        </g>

        {/* ——— Saddle + blanket ——— */}
        <path
          d="M188 132 C210 124 248 124 268 134 C264 148 240 154 214 152 C196 150 188 142 188 132 Z"
          fill={silkB}
          opacity="0.92"
        />
        <path
          d="M198 128 C220 122 250 124 262 134"
          fill="none"
          stroke={silkA}
          strokeWidth="3"
          opacity="0.7"
        />
        <path
          d="M204 136 C228 130 252 134 258 142"
          fill="#1a120c"
          opacity="0.55"
        />

        {/* ——— Jockey (racing crouch) ——— */}
        <g className="jockey">
          {/* far leg / stirrup */}
          <path
            d="M218 148 L208 178"
            stroke={`url(#${uid}-boot)`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* near boot */}
          <path
            d="M232 148 L242 180"
            stroke={`url(#${uid}-boot)`}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M238 178 L252 180"
            stroke="#0c0a08"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* torso / silks */}
          <path
            d="M206 118
               C214 104 246 104 254 118
               C258 130 250 146 230 148
               C210 146 202 130 206 118 Z"
            fill={`url(#${uid}-silk)`}
          />
          {/* silk chevron mark */}
          <path
            d="M218 122 L230 136 L242 122"
            fill="none"
            stroke={silkB}
            strokeWidth="2.5"
            opacity="0.85"
          />

          {/* arms + reins */}
          <path
            d="M212 124 C190 118 160 108 130 96"
            fill="none"
            stroke={silkA}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M244 124 C250 120 248 112 238 110"
            fill="none"
            stroke={silkA}
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            className="rein"
            d="M128 94 C160 108 190 120 210 126"
            fill="none"
            stroke="#2a2218"
            strokeWidth="1.6"
            opacity="0.85"
          />

          {/* gloves */}
          <circle cx="128" cy="95" r="4" fill={skin} />

          {/* neck + helmet */}
          <path d="M224 108 L228 98 L236 108 Z" fill={skin} />
          <ellipse cx="232" cy="92" rx="13" ry="11" fill={silkA} />
          <path
            d="M220 90 C228 78 242 78 246 92 C240 86 228 86 220 90 Z"
            fill={shade(silkA, -25)}
          />
          {/* goggles */}
          <path
            d="M224 92 C230 88 240 88 244 92"
            fill="none"
            stroke="#1a120c"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="228" cy="93" r="2.5" fill="#7ec8e3" opacity="0.55" />
          <circle cx="238" cy="93" r="2.5" fill="#7ec8e3" opacity="0.55" />
        </g>
      </g>

      {/* Track dust plume */}
      {racing && (
        <g className="dust" opacity="0.55">
          <ellipse
            className="dust-p"
            cx="300"
            cy="246"
            rx="10"
            ry="4"
            fill="#c4a574"
          />
          <ellipse
            className="dust-p d2"
            cx="328"
            cy="248"
            rx="14"
            ry="5"
            fill="#a89070"
          />
          <ellipse
            className="dust-p d3"
            cx="358"
            cy="245"
            rx="18"
            ry="6"
            fill="#8a7460"
          />
          <circle className="dust-p d2" cx="318" cy="240" r="3" fill="#d4c4a8" />
          <circle className="dust-p d3" cx="346" cy="238" r="2.5" fill="#d4c4a8" />
        </g>
      )}
    </svg>
  );
}
