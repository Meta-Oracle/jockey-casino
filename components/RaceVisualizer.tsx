"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedHorse from "@/components/AnimatedHorse";
import { getStats } from "@/lib/game";
import {
  raceVisualElapsed,
  type RacePlan,
} from "@/lib/pvp/simulate";
import type { PvpMatch } from "@/lib/pvp/store";
import { shortKey } from "@/components/WalletBar";

interface Props {
  match: PvpMatch;
  serverSkewMs?: number;
  onFinished?: () => void;
}

export default function RaceVisualizer({
  match,
  serverSkewMs = 0,
  onFinished,
}: Props) {
  const plan = match.race as RacePlan | undefined;
  const trackRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now() + serverSkewMs);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
  }, [match.id, plan?.startedAt]);

  useEffect(() => {
    if (!plan) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now() + serverSkewMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [plan, serverSkewMs]);

  const visual = useMemo(() => {
    if (!plan) return null;
    return raceVisualElapsed(plan, now);
  }, [plan, now]);

  useEffect(() => {
    if (!visual || visual.phase !== "finished" || finishedRef.current) return;
    finishedRef.current = true;
    onFinished?.();
  }, [visual, onFinished]);

  if (!plan || !match.guest || !visual) {
    return null;
  }

  const hostStats = plan.host.stats;
  const guestStats = plan.guest.stats;
  const countdownSec = Math.ceil(visual.countdownLeft / 1000);

  // Camera follows the leader slightly
  const lead = Math.max(visual.hostProgress, visual.guestProgress);
  const camShift = Math.min(12, lead * 14);

  return (
    <div className="race-viz" ref={trackRef}>
      <div className="race-viz-hud">
        <div className="race-stat-card">
          <strong>{match.host.horse.name}</strong>
          <span>{shortKey(match.host.wallet)}</span>
          <ul>
            <li>SPD {hostStats.speed}</li>
            <li>STA {hostStats.stamina}</li>
            <li>LCK {hostStats.luck}</li>
            <li>GRT {hostStats.grit}</li>
          </ul>
        </div>
        <div className="race-viz-center">
          {visual.phase === "countdown" && (
            <div className="race-countdown" key={countdownSec}>
              {countdownSec > 0 ? countdownSec : "GO"}
            </div>
          )}
          {visual.phase === "running" && (
            <div className="race-phase-label">LIVE</div>
          )}
          {visual.phase === "finished" && (
            <div className="race-phase-label win">
              {plan.winner === "host"
                ? match.host.horse.name
                : match.guest.horse.name}{" "}
              WINS
            </div>
          )}
        </div>
        <div className="race-stat-card right">
          <strong>{match.guest.horse.name}</strong>
          <span>{shortKey(match.guest.wallet)}</span>
          <ul>
            <li>SPD {guestStats.speed}</li>
            <li>STA {guestStats.stamina}</li>
            <li>LCK {guestStats.luck}</li>
            <li>GRT {guestStats.grit}</li>
          </ul>
        </div>
      </div>

      <div className="race-track-wrap">
        <svg
          className="race-track-bg"
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="rvTurf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f5c40" />
              <stop offset="100%" stopColor="#06281c" />
            </linearGradient>
            <linearGradient id="rvDirt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a6e52" />
              <stop offset="100%" stopColor="#4a382c" />
            </linearGradient>
            <linearGradient id="rvRail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c9a227" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f0d78c" />
              <stop offset="100%" stopColor="#c9a227" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect width="1200" height="320" fill="url(#rvTurf)" />
          <rect y="70" width="1200" height="100" fill="url(#rvDirt)" opacity="0.95" />
          <rect y="175" width="1200" height="100" fill="url(#rvDirt)" opacity="0.9" />
          <path d="M0 70 H1200" stroke="url(#rvRail)" strokeWidth="3" />
          <path d="M0 170 H1200" stroke="url(#rvRail)" strokeWidth="2" opacity="0.7" />
          <path d="M0 275 H1200" stroke="url(#rvRail)" strokeWidth="3" />
          {/* lane dashes */}
          <path
            d="M0 120 H1200"
            stroke="#d4c4a8"
            strokeWidth="1.5"
            strokeDasharray="16 12"
            opacity="0.35"
          />
          <path
            d="M0 225 H1200"
            stroke="#d4c4a8"
            strokeWidth="1.5"
            strokeDasharray="16 12"
            opacity="0.35"
          />
          {/* finish */}
          <g>
            <rect x="1120" y="60" width="10" height="230" fill="#e8e2d6" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect
                key={i}
                x="1120"
                y={60 + i * 28}
                width="10"
                height="14"
                fill={i % 2 === 0 ? "#c41e3a" : "#e8e2d6"}
              />
            ))}
          </g>
          {/* furlong markers */}
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={80 + p * 1000}
              y1="70"
              x2={80 + p * 1000}
              y2="275"
              stroke="#e8b84a"
              strokeOpacity="0.2"
              strokeDasharray="4 6"
            />
          ))}
        </svg>

        <div
          className="race-lanes"
          style={{
            transform: `translateX(-${camShift}%)`,
          }}
        >
          <div className="race-lane">
            <div
              className="race-runner"
              style={{
                left: `calc(${visual.hostProgress * 88}% )`,
              }}
            >
              <AnimatedHorse
                horse={match.host.horse}
                size="sm"
                racing={visual.phase === "running"}
              />
              <span className="runner-tag">
                {match.host.horse.name}
                <em>{Math.round(visual.hostProgress * 100)}%</em>
              </span>
            </div>
          </div>
          <div className="race-lane">
            <div
              className="race-runner"
              style={{
                left: `calc(${visual.guestProgress * 88}% )`,
              }}
            >
              <AnimatedHorse
                horse={match.guest.horse}
                size="sm"
                racing={visual.phase === "running"}
              />
              <span className="runner-tag">
                {match.guest.horse.name}
                <em>{Math.round(visual.guestProgress * 100)}%</em>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="race-progress-bars">
        <div className="rp-row">
          <span>Lane 1</span>
          <div className="rp-bar">
            <i style={{ width: `${visual.hostProgress * 100}%` }} />
          </div>
        </div>
        <div className="rp-row">
          <span>Lane 2</span>
          <div className="rp-bar">
            <i style={{ width: `${visual.guestProgress * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pre-race paddock preview with live stats from current builds */
export function PaddockPreview({ match }: { match: PvpMatch }) {
  const hostStats = getStats(match.host.horse);
  const guestStats = match.guest ? getStats(match.guest.horse) : null;

  return (
    <div className="paddock">
      <div className="paddock-lane">
        <AnimatedHorse horse={match.host.horse} size="md" racing={false} />
        <div>
          <strong>{match.host.horse.name}</strong>
          <p className="muted">
            {match.host.horse.breedId} · {shortKey(match.host.wallet)}
            {match.host.paid ? " · stake locked" : " · unpaid"}
          </p>
          <ul className="mini-stats">
            <li>SPD {hostStats.speed}</li>
            <li>STA {hostStats.stamina}</li>
            <li>LCK {hostStats.luck}</li>
            <li>GRT {hostStats.grit}</li>
          </ul>
        </div>
      </div>
      <div className="vs">VS</div>
      <div className="paddock-lane">
        {match.guest && guestStats ? (
          <>
            <AnimatedHorse horse={match.guest.horse} size="md" racing={false} />
            <div>
              <strong>{match.guest.horse.name}</strong>
              <p className="muted">
                {match.guest.horse.breedId} · {shortKey(match.guest.wallet)}
                {match.guest.paid ? " · stake locked" : " · unpaid"}
              </p>
              <ul className="mini-stats">
                <li>SPD {guestStats.speed}</li>
                <li>STA {guestStats.stamina}</li>
                <li>LCK {guestStats.luck}</li>
                <li>GRT {guestStats.grit}</li>
              </ul>
            </div>
          </>
        ) : (
          <p className="muted">Waiting for challenger to enter the arena…</p>
        )}
      </div>
    </div>
  );
}
