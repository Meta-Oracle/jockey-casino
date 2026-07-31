import { powerScore, type HorseConfig } from "@/lib/game";

export function resolvePvP(
  host: HorseConfig,
  guest: HorseConfig
): { winner: "host" | "guest"; hostScore: number; guestScore: number } {
  const hostScore = powerScore(host) + Math.random() * 10;
  const guestScore = powerScore(guest) + Math.random() * 10;
  if (hostScore === guestScore) {
    return {
      winner: Math.random() > 0.5 ? "host" : "guest",
      hostScore,
      guestScore,
    };
  }
  return {
    winner: hostScore > guestScore ? "host" : "guest",
    hostScore,
    guestScore,
  };
}
