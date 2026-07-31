import { NextResponse } from "next/server";
import { getMatch, saveMatch } from "@/lib/pvp/store";
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
  if (match.guest) {
    return NextResponse.json({ error: "Match full" }, { status: 409 });
  }

  match.guest = {
    wallet: body.wallet,
    horse: body.horse,
    paid: false,
  };
  match.status = "full";
  await saveMatch(match);

  return NextResponse.json({ match });
}
