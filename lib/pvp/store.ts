import type { HorseConfig } from "@/lib/game";
import { ECONOMY } from "@/lib/token";
import type { RacePlan } from "@/lib/pvp/simulate";

export type MatchStatus =
  | "open"
  | "full"
  | "racing"
  | "settling"
  | "settled"
  | "cancelled";

export interface PvpPlayer {
  wallet: string;
  horse: HorseConfig;
  depositTx?: string;
  paid: boolean;
  ready?: boolean;
}

export interface PvpMatch {
  id: string;
  stake: number;
  host: PvpPlayer;
  guest?: PvpPlayer;
  participants: PvpPlayer[];
  maxPlayers: number;
  status: MatchStatus;
  houseFeeBps: number;
  createdAt: number;
  race?: RacePlan;
  winnerWallet?: string;
  hostScore?: number;
  guestScore?: number;
  payoutTx?: string;
  payoutNote?: string;
  settledAt?: number;
}

type GlobalStore = {
  __jockeyPvp?: Map<string, PvpMatch>;
};

function memoryMap(): Map<string, PvpMatch> {
  const g = globalThis as GlobalStore;
  if (!g.__jockeyPvp) g.__jockeyPvp = new Map();
  return g.__jockeyPvp;
}

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function redisFetch(
  command: (string | number)[]
): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Redis error ${res.status}`);
  }
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

const KEY = (id: string) => `jockey:pvp:${id}`;
const INDEX = "jockey:pvp:index";

export async function saveMatch(match: PvpMatch): Promise<void> {
  if (redisConfigured()) {
    await redisFetch([
      "SET",
      KEY(match.id),
      JSON.stringify(match),
      "EX",
      86400,
    ]);
    await redisFetch(["SADD", INDEX, match.id]);
    return;
  }
  memoryMap().set(match.id, match);
}

export async function getMatch(id: string): Promise<PvpMatch | null> {
  if (redisConfigured()) {
    const raw = await redisFetch(["GET", KEY(id)]);
    if (!raw || typeof raw !== "string") return null;
    return JSON.parse(raw) as PvpMatch;
  }
  return memoryMap().get(id) ?? null;
}

export async function listOpenMatches(): Promise<PvpMatch[]> {
  if (redisConfigured()) {
    const ids = (await redisFetch(["SMEMBERS", INDEX])) as string[] | null;
    if (!ids?.length) return [];
    const matches: PvpMatch[] = [];
    for (const id of ids) {
      const m = await getMatch(id);
      if (m && (m.status === "open" || m.status === "full" || m.status === "racing")) {
        matches.push(m);
      }
    }
    return matches.sort((a, b) => b.createdAt - a.createdAt);
  }
  return [...memoryMap().values()]
    .filter(
      (m) =>
        m.status === "open" || m.status === "full" || m.status === "racing"
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function newMatchId(): string {
  return `race_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createMatchDraft(params: {
  wallet: string;
  horse: HorseConfig;
  stake: number;
}): PvpMatch {
  const allowed = ECONOMY.stakePresets as readonly number[];
  if (!allowed.includes(params.stake)) {
    throw new Error("Invalid stake preset");
  }
  const host: PvpPlayer = {
    wallet: params.wallet,
    horse: params.horse,
    paid: false,
    ready: true,
  };

  return {
    id: newMatchId(),
    stake: params.stake,
    host,
    participants: [host],
    maxPlayers: 4,
    status: "open",
    houseFeeBps: ECONOMY.houseFeeBps,
    createdAt: Date.now(),
  };
}
