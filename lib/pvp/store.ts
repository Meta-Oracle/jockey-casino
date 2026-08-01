import { promises as fs } from "fs";
import os from "os";
import path from "path";
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

const STORE_FILE = process.env.JOCKEY_PVP_STORE_FILE || path.join(os.tmpdir(), "jockey-pvp-store.json");

function memoryMap(): Map<string, PvpMatch> {
  const g = globalThis as GlobalStore;
  if (!g.__jockeyPvp) g.__jockeyPvp = new Map();
  return g.__jockeyPvp;
}

async function readPersistedMap(): Promise<Map<string, PvpMatch>> {
  const map = memoryMap();
  if (map.size > 0) return map;

  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, PvpMatch>;
    for (const [id, match] of Object.entries(parsed)) {
      map.set(id, match);
    }
  } catch {
    // No existing store file yet; fall back to an empty in-memory map.
  }

  return map;
}

async function writePersistedMap(map: Map<string, PvpMatch>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(Object.fromEntries(map), null, 2), "utf8");
  } catch {
    // Ignore filesystem write failures and keep the in-memory fallback.
  }
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
    try {
      await redisFetch([
        "SET",
        KEY(match.id),
        JSON.stringify(match),
        "EX",
        86400,
      ]);
      await redisFetch(["SADD", INDEX, match.id]);
      return;
    } catch {
      // Fall back to local persistence if Redis is unavailable.
    }
  }

  const map = await readPersistedMap();
  map.set(match.id, match);
  await writePersistedMap(map);
}

export async function getMatch(id: string): Promise<PvpMatch | null> {
  if (redisConfigured()) {
    try {
      const raw = await redisFetch(["GET", KEY(id)]);
      if (!raw || typeof raw !== "string") return null;
      return JSON.parse(raw) as PvpMatch;
    } catch {
      // Fall back to local persistence if Redis is unavailable.
    }
  }

  const map = await readPersistedMap();
  return map.get(id) ?? null;
}

export async function listOpenMatches(): Promise<PvpMatch[]> {
  if (redisConfigured()) {
    try {
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
    } catch {
      // Fall back to local persistence if Redis is unavailable.
    }
  }

  const map = await readPersistedMap();
  return [...map.values()]
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
