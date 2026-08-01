/** Solana mint = pump.fun CA */
export const TOKEN = {
  name: "JOCKEY",
  ticker: "$JCKYCSNO",
  ca: "7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
  mint: "7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
  chain: "Solana",
  decimals: 6,
  dexUrl: "https://pump.fun/coin/7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
  birdeyeUrl:
    "https://birdeye.so/token/7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump?chain=solana",
  solscanUrl:
    "https://solscan.io/token/7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump",
} as const;

export const SHORT_CA = `${TOKEN.ca.slice(0, 6)}…${TOKEN.ca.slice(-4)}`;

/** All in-game spends + PvP buy-ins land here. Set in env. */
export const TREASURY_WALLET =
  process.env.NEXT_PUBLIC_TREASURY_WALLET?.trim() || "";

const DEFAULT_SOLANA_RPC_ENDPOINTS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
] as const;

export const SOLANA_RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_SOLANA_RPC?.trim(),
  ...DEFAULT_SOLANA_RPC_ENDPOINTS,
].filter(
  (value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
);

export const SOLANA_RPC = SOLANA_RPC_ENDPOINTS[0] ?? DEFAULT_SOLANA_RPC_ENDPOINTS[0];

/** Human-unit $JCKYCSNO amounts (UI). On-chain = amount * 10^decimals */
export const ECONOMY = {
  /** 100% of upgrade spend → treasury */
  upgradeCost: 10_000,
  /** PvP stake presets */
  stakePresets: [10_000, 50_000, 100_000, 250_000] as const,
  /** House cut on PvP pot (basis points). 800 = 8%. Stays in treasury. */
  houseFeeBps: 800,
  /** Solo practice race still optional; live solo entry → treasury */
  soloEntryCost: 5_000,
} as const;

export function toAtomic(amount: number): bigint {
  const factor = 10 ** TOKEN.decimals;
  return BigInt(Math.round(amount * factor));
}

export function fromAtomic(raw: bigint | number): number {
  const n = typeof raw === "bigint" ? Number(raw) : raw;
  return n / 10 ** TOKEN.decimals;
}

export function houseCut(stakeEach: number): number {
  const pot = stakeEach * 2;
  return (pot * ECONOMY.houseFeeBps) / 10_000;
}

export function winnerPayout(stakeEach: number): number {
  return stakeEach * 2 - houseCut(stakeEach);
}

export function economyReady(): boolean {
  return Boolean(TREASURY_WALLET && TREASURY_WALLET.length >= 32);
}
