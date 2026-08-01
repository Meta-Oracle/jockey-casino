import { NextResponse } from "next/server";
import { getMatch, saveMatch } from "@/lib/pvp/store";
import { hashSeed, simulateMultiRace } from "@/lib/pvp/simulate";
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

  const participant = match.participants.find((player) => player.wallet === body.wallet);
  if (!participant) {
    return NextResponse.json({ error: "Not a player" }, { status: 403 });
  }

  const role = participant.wallet === match.host.wallet ? "host" : "guest";
  if (participant.paid) {
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

  participant.paid = true;
  participant.depositTx = body.signature;
  await saveMatch(match);

  const allPaid = match.participants.every((player) => player.paid);
  if (!allPaid || match.participants.length < 2) {
    return NextResponse.json({ match });
  }

  // Authoritative race from live horse builds (breed + upgrades + silks stats path)
  const seed = hashSeed(
    `${match.id}:${match.participants.map((player) => player.depositTx ?? "none").join(":")}`
  );
  const startedAt = Date.now();
  const race = simulateMultiRace(
    match.participants.map((player) => player.horse),
    seed,
    startedAt
  );

  match.race = race;
  match.status = "racing";
  match.winnerWallet = match.participants[race.winnerIndex]?.wallet;
  match.hostScore = race.host.finishMs;
  match.guestScore = race.guest?.finishMs ?? race.runners[1]?.finishMs;
  await saveMatch(match);

  return NextResponse.json({ match });
}
