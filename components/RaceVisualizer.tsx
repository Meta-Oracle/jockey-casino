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

  if (!plan || !visual) {
    return null;
  }

  const hostStats = plan.host.stats;
  const secondaryParticipant = match.participants[1] ?? match.participants[0];
  const guestStats = plan.guest?.stats ?? plan.runners[1]?.stats ?? secondaryParticipant?.horse ? getStats(secondaryParticipant.horse) : undefined;
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
                : secondaryParticipant?.horse.name ?? "Runner"}{" "}
              WINS
            </div>
          )}
        </div>
        <div className="race-stat-card right">
          <strong>{secondaryParticipant?.horse.name ?? "Waiting"}</strong>
          <span>{secondaryParticipant ? shortKey(secondaryParticipant.wallet) : "—"}</span>
          <ul>
            <li>SPD {guestStats?.speed ?? 0}</li>
            <li>STA {guestStats?.stamina ?? 0}</li>
            <li>LCK {guestStats?.luck ?? 0}</li>
            <li>GRT {guestStats?.grit ?? 0}</li>
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
          {match.participants.slice(0, 4).map((player, index) => {
            const progress = visual.runnerProgresses[index] ?? 0;
            const label = player.horse.name || `Runner ${index + 1}`;
            return (
              <div className="race-lane" key={player.wallet}>
                <div
                  className="race-runner"
                  style={{
                    left: `calc(${progress * 88}% )`,
                  }}
                >
                  <AnimatedHorse
                    horse={player.horse}
                    size="sm"
                    racing={visual.phase === "running"}
                  />
                  <span className="runner-tag">
                    {label}
                    <em>{Math.round(progress * 100)}%</em>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="race-progress-bars">
        {match.participants.slice(0, 4).map((player, index) => (
          <div className="rp-row" key={`${player.wallet}-${index}`}>
            <span>{player.horse.name || `Lane ${index + 1}`}</span>
            <div className="rp-bar">
              <i style={{ width: `${(visual.runnerProgresses[index] ?? 0) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pre-race paddock preview with live stats from current builds */
export function PaddockPreview({ match }: { match: PvpMatch }) {
  return (
    <div className="paddock">
      {match.participants.slice(0, 4).map((participant, index) => {
        const stats = getStats(participant.horse);
        return (
          <div className="paddock-lane" key={participant.wallet}>
            <AnimatedHorse horse={participant.horse} size="md" racing={false} />
            <div>
              <strong>{participant.horse.name}</strong>
              <p className="muted">
                {participant.horse.breedId} · {shortKey(participant.wallet)}
                {participant.paid ? " · stake locked" : " · unpaid"}
                {index === 0 ? " · host" : ""}
              </p>
              <ul className="mini-stats">
                <li>SPD {stats.speed}</li>
                <li>STA {stats.stamina}</li>
                <li>LCK {stats.luck}</li>
                <li>GRT {stats.grit}</li>
              </ul>
            </div>
          </div>
        );
      })}
      {match.participants.length < 2 && (
        <p className="muted">Waiting for challengers to enter the arena…</p>
      )}
    </div>
  );
}
