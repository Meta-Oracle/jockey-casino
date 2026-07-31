import { NextResponse } from "next/server";
import { getMatch, saveMatch } from "@/lib/pvp/store";
import type { HorseConfig } from "@/lib/game";

export const dynamic = "force-dynamic";

/** Push latest horse build (stats/gear/upgrades) before stakes lock. */
export async function POST(req: Request) {
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

  if (match.status !== "open" && match.status !== "full") {
    return NextResponse.json(
      { error: "Horse locked — race already underway" },
      { status: 409 }
    );
  }

  if (match.host.wallet === body.wallet) {
    if (match.host.paid) {
      return NextResponse.json(
        { error: "Stake already paid — horse frozen" },
        { status: 409 }
      );
    }
    match.host.horse = body.horse;
    match.host.ready = true;
  } else if (match.guest?.wallet === body.wallet) {
    if (match.guest.paid) {
      return NextResponse.json(
        { error: "Stake already paid — horse frozen" },
        { status: 409 }
      );
    }
    match.guest.horse = body.horse;
    match.guest.ready = true;
  } else {
    return NextResponse.json({ error: "Not a player" }, { status: 403 });
  }

  await saveMatch(match);
  return NextResponse.json({ match });
}
