import { NextResponse } from "next/server";
import { createMatchDraft, saveMatch, listOpenMatches } from "@/lib/pvp/store";
import type { HorseConfig } from "@/lib/game";
import { economyReady } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await listOpenMatches();
  return NextResponse.json({
    matches,
    store: process.env.UPSTASH_REDIS_REST_URL ? "redis" : "memory",
  });
}

export async function POST(req: Request) {
  if (!economyReady()) {
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_TREASURY_WALLET to enable live PvP" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    wallet?: string;
    horse?: HorseConfig;
    stake?: number;
  };

  if (!body.wallet || !body.horse || !body.stake) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const match = createMatchDraft({
      wallet: body.wallet,
      horse: body.horse,
      stake: body.stake,
    });
    await saveMatch(match);
    return NextResponse.json({ match });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}
