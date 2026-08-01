import { NextResponse } from "next/server";
import { getMatch, saveMatch, type PvpPlayer } from "@/lib/pvp/store";
import type { HorseConfig } from "@/lib/game";
import { economyReady } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!economyReady()) {
    return NextResponse.json(
      { error: "Treasury not configured" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    matchId?: string;
    wallet?: string;
    horse?: HorseConfig;
  };

  if (!body.matchId || !body.wallet || !body.horse) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const match = await getMatch(body.matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (match.status !== "open") {
    return NextResponse.json({ error: "Match not open" }, { status: 409 });
  }
  if (match.host.wallet === body.wallet) {
    return NextResponse.json(
      { error: "Cannot join your own match" },
      { status: 400 }
    );
  }
  if (match.participants.length >= (match.maxPlayers ?? 4)) {
    return NextResponse.json({ error: "Match full" }, { status: 409 });
  }
  if (match.participants.some((player) => player.wallet === body.wallet)) {
    return NextResponse.json({ error: "Already joined" }, { status: 409 });
  }

  const entrant: PvpPlayer = {
    wallet: body.wallet,
    horse: body.horse,
    paid: false,
  };
  match.participants.push(entrant);
  match.guest = entrant;
  match.status = match.participants.length >= 2 ? "full" : "open";
  await saveMatch(match);

  return NextResponse.json({ match });
}
