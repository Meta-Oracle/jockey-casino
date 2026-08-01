import { getMatch, saveMatch, type PvpMatch } from "@/lib/pvp/store";
import { totalRaceWallMs } from "@/lib/pvp/simulate";
import { payoutWinner } from "@/lib/solana";
import { winnerPayout } from "@/lib/token";

/** If race wall-clock is done and not yet settled, pay winner once. */
export async function maybeSettleMatch(
  match: PvpMatch
): Promise<PvpMatch> {
  if (
    match.status === "settled" ||
    match.status === "settling" ||
    match.status === "cancelled"
  ) {
    return match;
  }
  if (match.status !== "racing" || !match.race || match.participants.length < 2) {
    return match;
  }

  const wall = totalRaceWallMs(match.race);
  if (Date.now() < match.race.startedAt + wall) {
    return match;
  }

  match.status = "settling";
  await saveMatch(match);

  // Re-read to reduce double-payout races across instances
  const latest = await getMatch(match.id);
  if (!latest) return match;
  if (latest.status === "settled") return latest;
  if (latest.status !== "settling") return latest;

  const winnerIndex = latest.race!.winnerIndex;
  const winnerParticipant = latest.participants[winnerIndex] ?? latest.participants[0];
  const winnerWallet = winnerParticipant.wallet;

  latest.winnerWallet = winnerWallet;
  latest.hostScore = latest.race!.host.finishMs;
  latest.guestScore = latest.race!.runners[1]?.finishMs ?? latest.race!.guest?.finishMs;

  const payout = winnerPayout(latest.stake);
  const pay = await payoutWinner({
    winnerWallet,
    humanAmount: payout,
    memo: `jockey-payout:${latest.id}`,
  });

  if (pay.ok) {
    latest.payoutTx = pay.signature;
    latest.payoutNote = `Winner paid ${payout} $JCKYCSNO (house cut retained in treasury)`;
  } else {
    latest.payoutNote = `Winner: ${winnerWallet}. Payout pending — ${pay.reason}. Stakes + house cut already in treasury.`;
  }

  latest.status = "settled";
  latest.settledAt = Date.now();
  await saveMatch(latest);
  return latest;
}

export async function getMatchFresh(id: string): Promise<PvpMatch | null> {
  const match = await getMatch(id);
  if (!match) return null;
  return maybeSettleMatch(match);
}
