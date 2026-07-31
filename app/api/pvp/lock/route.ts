import { NextResponse } from "next/server";
import { getMatch, saveMatch } from "@/lib/pvp/store";
import { resolvePvP } from "@/lib/pvp/resolve";
import { payoutWinner, verifyTreasurySpend } from "@/lib/solana";
import { winnerPayout } from "@/lib/token";

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

  match.status = "settling";
  await saveMatch(match);

  const outcome = resolvePvP(match.host.horse, match.guest.horse);
  const winnerWallet =
    outcome.winner === "host" ? match.host.wallet : match.guest.wallet;
  const payout = winnerPayout(match.stake);

  match.hostScore = outcome.hostScore;
  match.guestScore = outcome.guestScore;
  match.winnerWallet = winnerWallet;

  const pay = await payoutWinner({
    winnerWallet,
    humanAmount: payout,
    memo: `jockey-payout:${match.id}`,
  });

  if (pay.ok) {
    match.payoutTx = pay.signature;
    match.payoutNote = `Winner paid ${payout} JOCKEY (house cut retained in treasury)`;
  } else {
    match.payoutNote = `Winner: ${winnerWallet}. Payout pending — ${pay.reason}. Stakes + house cut already in treasury.`;
  }

  match.status = "settled";
  await saveMatch(match);

  return NextResponse.json({ match });
}
