export const TOKEN = {
  name: "JOCKEY",
  ticker: "$JOCKEY",
  ca: "7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
  chain: "Solana",
  dexUrl: "https://pump.fun/coin/7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
  birdeyeUrl:
    "https://birdeye.so/token/7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump?chain=solana",
  solscanUrl:
    "https://solscan.io/token/7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
} as const;

export const SHORT_CA = `${TOKEN.ca.slice(0, 6)}…${TOKEN.ca.slice(-4)}`;
