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

  const participant = match.participants.find((player) => player.wallet === body.wallet);
  if (!participant) {
    return NextResponse.json({ error: "Not a player" }, { status: 403 });
  }

  if (participant.paid) {
    return NextResponse.json(
      { error: "Stake already paid — horse frozen" },
      { status: 409 }
    );
  }

  participant.horse = body.horse;
  participant.ready = true;

  if (match.host.wallet === body.wallet) {
    match.host = participant;
  } else if (match.guest?.wallet === body.wallet) {
    match.guest = participant;
  }

  if (match.participants[0]) {
    match.host = match.participants[0];
  }
  if (match.participants[1]) {
    match.guest = match.participants[1];
  }

  await saveMatch(match);
  return NextResponse.json({ match });
}
