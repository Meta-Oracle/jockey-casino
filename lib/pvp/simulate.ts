import { getStats, type HorseConfig } from "@/lib/game";

/** Deterministic PRNG for shared client/server replay */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface RunnerPlan {
  samples: number[]; // progress 0..1 at each step
  finishMs: number; // when progress first hit 1
  stats: { speed: number; stamina: number; luck: number; grit: number };
}

export interface RacePlan {
  seed: number;
  startedAt: number;
  durationMs: number;
  steps: number;
  countdownMs: number;
  host: RunnerPlan;
  guest: RunnerPlan;
  winner: "host" | "guest";
}

const DEFAULT_DURATION = 12_000;
const DEFAULT_STEPS = 120;
const COUNTDOWN_MS = 3_000;

/**
 * Physics:
 * - speed → base stride velocity
 * - stamina → resists late-race fade
 * - luck → seeded surge/stall variance
 * - grit → closes gaps when trailing
 * Breed base + upgrades flow through getStats().
 */
export function simulateRace(
  hostHorse: HorseConfig,
  guestHorse: HorseConfig,
  seed: number,
  startedAt = Date.now()
): RacePlan {
  const durationMs = DEFAULT_DURATION;
  const steps = DEFAULT_STEPS;
  const dt = durationMs / steps;
  const rng = mulberry32(seed);

  const hostStats = getStats(hostHorse);
  const guestStats = getStats(guestHorse);

  let hostP = 0;
  let guestP = 0;
  const hostSamples: number[] = [];
  const guestSamples: number[] = [];
  let hostFinish = durationMs;
  let guestFinish = durationMs;
  let hostDone = false;
  let guestDone = false;

  // Warm RNG differently per lane so luck isn't identical
  const hostRng = mulberry32(seed ^ 0xa5a5a5a5);
  const guestRng = mulberry32(seed ^ 0x5a5a5a5a);
  void rng();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0..1 race fraction
    const elapsed = i * dt;

    if (!hostDone) {
      hostP = stepProgress(hostP, guestP, hostStats, t, hostRng, dt);
      if (hostP >= 1) {
        hostP = 1;
        hostDone = true;
        hostFinish = elapsed;
      }
    }
    if (!guestDone) {
      guestP = stepProgress(guestP, hostP, guestStats, t, guestRng, dt);
      if (guestP >= 1) {
        guestP = 1;
        guestDone = true;
        guestFinish = elapsed;
      }
    }

    hostSamples.push(hostP);
    guestSamples.push(guestP);
  }

  // Ensure someone finishes — stretch leader if both stalled
  if (!hostDone && !guestDone) {
    if (hostP >= guestP) {
      hostSamples[hostSamples.length - 1] = 1;
      hostFinish = durationMs;
      hostDone = true;
    } else {
      guestSamples[guestSamples.length - 1] = 1;
      guestFinish = durationMs;
      guestDone = true;
    }
  }

  const winner: "host" | "guest" =
    hostFinish === guestFinish
      ? hostSamples[hostSamples.length - 1] >=
        guestSamples[guestSamples.length - 1]
        ? "host"
        : "guest"
      : hostFinish < guestFinish
        ? "host"
        : "guest";

  return {
    seed,
    startedAt,
    durationMs,
    steps,
    countdownMs: COUNTDOWN_MS,
    host: { samples: hostSamples, finishMs: hostFinish, stats: hostStats },
    guest: { samples: guestSamples, finishMs: guestFinish, stats: guestStats },
    winner,
  };
}

function stepProgress(
  self: number,
  rival: number,
  stats: { speed: number; stamina: number; luck: number; grit: number },
  t: number,
  rng: () => number,
  dt: number
): number {
  // Base velocity from speed (normalized ~0.55–1.15)
  const speedFactor = 0.52 + (stats.speed / 15) * 0.7;

  // Stamina: early races are free; late fade is harsher without stamina
  const fade =
    t < 0.45
      ? 1
      : Math.max(
          0.42,
          1 - (t - 0.45) * (1.35 - stats.stamina / 15) * 1.15
        );

  // Luck: discrete surges / stalls
  const luckAmp = (stats.luck / 15) * 0.38;
  const luckPulse = 1 + (rng() - 0.48) * luckAmp;

  // Grit: when trailing, dig in
  const trailing = self + 0.02 < rival;
  const gritBoost = trailing ? 1 + (stats.grit / 15) * 0.32 : 1;

  // Occasional grit snap when far behind late
  const desperation =
    trailing && t > 0.65 ? 1 + (stats.grit / 15) * 0.18 * rng() : 1;

  // Scale so typical finish ~8–12s
  const unitsPerSec = 0.095;
  const delta =
    speedFactor * fade * luckPulse * gritBoost * desperation * unitsPerSec * (dt / 1000);

  return Math.min(1, self + delta);
}

/** Interpolate progress at elapsed race time (after countdown). */
export function progressAt(
  plan: RunnerPlan,
  durationMs: number,
  steps: number,
  raceElapsedMs: number
): number {
  if (raceElapsedMs <= 0) return 0;
  if (raceElapsedMs >= plan.finishMs) return 1;
  const t = (raceElapsedMs / durationMs) * steps;
  const i0 = Math.floor(t);
  const i1 = Math.min(plan.samples.length - 1, i0 + 1);
  const frac = t - i0;
  const a = plan.samples[Math.min(i0, plan.samples.length - 1)] ?? 0;
  const b = plan.samples[i1] ?? a;
  return a + (b - a) * frac;
}

export function raceVisualElapsed(plan: RacePlan, now = Date.now()): {
  phase: "countdown" | "running" | "finished";
  countdownLeft: number;
  raceElapsed: number;
  hostProgress: number;
  guestProgress: number;
} {
  const sinceStart = now - plan.startedAt;
  if (sinceStart < plan.countdownMs) {
    return {
      phase: "countdown",
      countdownLeft: plan.countdownMs - sinceStart,
      raceElapsed: 0,
      hostProgress: 0,
      guestProgress: 0,
    };
  }

  const raceElapsed = sinceStart - plan.countdownMs;
  const hostProgress = progressAt(
    plan.host,
    plan.durationMs,
    plan.steps,
    raceElapsed
  );
  const guestProgress = progressAt(
    plan.guest,
    plan.durationMs,
    plan.steps,
    raceElapsed
  );

  const finished =
    raceElapsed >= Math.max(plan.host.finishMs, plan.guest.finishMs) + 400;

  return {
    phase: finished ? "finished" : "running",
    countdownLeft: 0,
    raceElapsed,
    hostProgress,
    guestProgress,
  };
}

export function totalRaceWallMs(plan: RacePlan): number {
  return (
    plan.countdownMs +
    Math.max(plan.host.finishMs, plan.guest.finishMs) +
    800
  );
}
