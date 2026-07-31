"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { getTokenBalance } from "@/lib/solana";
import { TOKEN, TREASURY_WALLET, economyReady } from "@/lib/token";

export default function WalletBar() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [bal, setBal] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBal(null);
      return;
    }
    try {
      const b = await getTokenBalance(publicKey);
      setBal(b);
    } catch {
      setBal(null);
    }
  }, [publicKey]);

  useEffect(() => {
    void refresh();
    if (!publicKey) return;
    const id = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(id);
  }, [publicKey, connection, refresh]);

  return (
    <div className="wallet-bar">
      <WalletMultiButton />
      {connected && bal !== null && (
        <span className="wallet-bal">
          {bal.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
          {TOKEN.ticker}
        </span>
      )}
      {!economyReady() && (
        <span className="wallet-warn">Set treasury wallet in env</span>
      )}
      {economyReady() && (
        <span className="wallet-treasury" title={TREASURY_WALLET}>
          Treasury live
        </span>
      )}
    </div>
  );
}

export function useSpendToTreasury() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  return useCallback(
    async (humanAmount: number, memo: string) => {
      if (!publicKey) throw new Error("Connect wallet");
      const { buildTreasurySpendTx } = await import("@/lib/solana");
      const tx = await buildTreasurySpendTx({
        from: publicKey,
        humanAmount,
        memo,
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [publicKey, sendTransaction, connection]
  );
}

export function shortKey(k: PublicKey | string) {
  const s = typeof k === "string" ? k : k.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}
