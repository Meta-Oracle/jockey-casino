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
  runners: RunnerPlan[];
  host: RunnerPlan;
  guest?: RunnerPlan;
  winnerIndex: number;
  winner: "host" | "guest" | "multi";
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
  return simulateMultiRace([hostHorse, guestHorse], seed, startedAt);
}

export function simulateMultiRace(
  horses: HorseConfig[],
  seed: number,
  startedAt = Date.now()
): RacePlan {
  const durationMs = DEFAULT_DURATION;
  const steps = DEFAULT_STEPS;
  const dt = durationMs / steps;

  const runners = horses.map((horse, index) => {
    const stats = getStats(horse);
    const rng = mulberry32(seed ^ (0x9e3779b9 + index * 0x85ebca6b));
    let progress = 0;
    const samples: number[] = [];
    let finishMs = durationMs;
    let done = false;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const elapsed = i * dt;
      if (!done) {
        const rivalProgress = i === 0 ? 0 : samples[i - 1] ?? 0;
        progress = stepProgress(progress, rivalProgress, stats, t, rng, dt);
        if (progress >= 1) {
          progress = 1;
          done = true;
          finishMs = elapsed;
        }
      }
      samples.push(progress);
    }

    return {
      samples,
      finishMs,
      stats,
    } satisfies RunnerPlan;
  });

  const winnerIndex = runners.reduce((bestIndex, runner, index, all) => {
    if (runner.finishMs < all[bestIndex].finishMs) return index;
    if (runner.finishMs === all[bestIndex].finishMs) {
      const currentLast = runner.samples.at(-1) ?? 0;
      const bestLast = all[bestIndex].samples.at(-1) ?? 0;
      return currentLast > bestLast ? index : bestIndex;
    }
    return bestIndex;
  }, 0);

  const host = runners[0] ?? {
    samples: [],
    finishMs: durationMs,
    stats: { speed: 0, stamina: 0, luck: 0, grit: 0 },
  };
  const guest = runners[1];
  const winner: RacePlan["winner"] =
    winnerIndex === 0 ? "host" : winnerIndex === 1 ? "guest" : "multi";

  return {
    seed,
    startedAt,
    durationMs,
    steps,
    countdownMs: COUNTDOWN_MS,
    runners,
    host,
    guest,
    winnerIndex,
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
  runnerProgresses: number[];
} {
  const sinceStart = now - plan.startedAt;
  if (sinceStart < plan.countdownMs) {
    return {
      phase: "countdown",
      countdownLeft: plan.countdownMs - sinceStart,
      raceElapsed: 0,
      hostProgress: 0,
      guestProgress: 0,
      runnerProgresses: plan.runners.map(() => 0),
    };
  }

  const raceElapsed = sinceStart - plan.countdownMs;
  const runnerProgresses = plan.runners.map((runner) =>
    progressAt(runner, plan.durationMs, plan.steps, raceElapsed)
  );
  const hostProgress = runnerProgresses[0] ?? 0;
  const guestProgress = runnerProgresses[1] ?? 0;

  const finished =
    raceElapsed >= Math.max(...plan.runners.map((runner) => runner.finishMs)) + 400;

  return {
    phase: finished ? "finished" : "running",
    countdownLeft: 0,
    raceElapsed,
    hostProgress,
    guestProgress,
    runnerProgresses,
  };
}

export function totalRaceWallMs(plan: RacePlan): number {
  return plan.countdownMs + Math.max(...plan.runners.map((runner) => runner.finishMs)) + 800;
}
