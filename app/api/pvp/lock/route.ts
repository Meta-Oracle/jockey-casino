import { NextResponse } from "next/server";
import { getMatch, saveMatch } from "@/lib/pvp/store";
import { hashSeed, simulateRace } from "@/lib/pvp/simulate";
import { verifyTreasurySpend } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    matchId?: string;
    wallet?: string;
    signature?: string;
  };

  if (!body.matchId || !body.wallet || !body.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const match = await getMatch(body.matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.status === "racing" || match.status === "settled") {
    return NextResponse.json({ match });
  }

  const role =
    match.host.wallet === body.wallet
      ? "host"
      : match.guest?.wallet === body.wallet
        ? "guest"
        : null;

  if (!role) {
    return NextResponse.json({ error: "Not a player" }, { status: 403 });
  }

  const player = role === "host" ? match.host : match.guest!;
  if (player.paid) {
    return NextResponse.json({ match, note: "Already locked" });
  }

  const memo = `jockey-pvp:${match.id}:${role}`;
  const verified = await verifyTreasurySpend({
    signature: body.signature,
    expectedFrom: body.wallet,
    expectedHumanAmount: match.stake,
    memoIncludes: memo,
  });

  if (!verified.ok) {
    return NextResponse.json({ error: verified.reason }, { status: 400 });
  }

  player.paid = true;
  player.depositTx = body.signature;
  await saveMatch(match);

  const bothPaid = match.host.paid && match.guest?.paid;
  if (!bothPaid || !match.guest) {
    return NextResponse.json({ match });
  }

  // Authoritative race from live horse builds (breed + upgrades + silks stats path)
  const seed = hashSeed(
    `${match.id}:${match.host.depositTx}:${match.guest.depositTx}`
  );
  const startedAt = Date.now();
  const race = simulateRace(
    match.host.horse,
    match.guest.horse,
    seed,
    startedAt
  );

  match.race = race;
  match.status = "racing";
  match.winnerWallet =
    race.winner === "host" ? match.host.wallet : match.guest.wallet;
  match.hostScore = race.host.finishMs;
  match.guestScore = race.guest.finishMs;
  await saveMatch(match);

  return NextResponse.json({ match });
}
