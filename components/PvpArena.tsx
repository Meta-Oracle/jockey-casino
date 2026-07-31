"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import AnimatedHorse from "@/components/AnimatedHorse";
import { useSpendToTreasury, shortKey } from "@/components/WalletBar";
import {
  ECONOMY,
  TOKEN,
  TREASURY_WALLET,
  economyReady,
  houseCut,
  winnerPayout,
} from "@/lib/token";
import type { HorseConfig } from "@/lib/game";
import type { PvpMatch } from "@/lib/pvp/store";

interface Props {
  horse: HorseConfig;
}

export default function PvpArena({ horse }: Props) {
  const { publicKey, connected } = useWallet();
  const spend = useSpendToTreasury();
  const [matches, setMatches] = useState<PvpMatch[]>([]);
  const [active, setActive] = useState<PvpMatch | null>(null);
  const [stake, setStake] = useState<number>(ECONOMY.stakePresets[1]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeMode, setStoreMode] = useState<string>("memory");

  const wallet = publicKey?.toBase58();

  const refreshLobby = useCallback(async () => {
    const res = await fetch("/api/pvp/lobby", { cache: "no-store" });
    const data = (await res.json()) as {
      matches: PvpMatch[];
      store?: string;
    };
    setMatches(data.matches ?? []);
    if (data.store) setStoreMode(data.store);
  }, []);

  const refreshActive = useCallback(async () => {
    if (!active?.id) return;
    const res = await fetch(`/api/pvp/match/${active.id}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { match: PvpMatch };
    setActive(data.match);
  }, [active?.id]);

  useEffect(() => {
    void refreshLobby();
    const id = window.setInterval(() => void refreshLobby(), 4000);
    return () => window.clearInterval(id);
  }, [refreshLobby]);

  useEffect(() => {
    if (!active || active.status === "settled") return;
    const id = window.setInterval(() => void refreshActive(), 2500);
    return () => window.clearInterval(id);
  }, [active, refreshActive]);

  async function createMatch() {
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pvp/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, horse, stake }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setActive(data.match);
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function joinMatch(matchId: string) {
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pvp/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, wallet, horse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Join failed");
      setActive(data.match);
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join failed");
    } finally {
      setBusy(false);
    }
  }

  async function lockStake() {
    if (!wallet || !active) return;
    const role =
      active.host.wallet === wallet
        ? "host"
        : active.guest?.wallet === wallet
          ? "guest"
          : null;
    if (!role) return;

    setBusy(true);
    setError(null);
    try {
      const memo = `jockey-pvp:${active.id}:${role}`;
      const signature = await spend(active.stake, memo);
      const res = await fetch("/api/pvp/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: active.id,
          wallet,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lock failed");
      setActive(data.match);
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lock failed");
    } finally {
      setBusy(false);
    }
  }

  const myPaid =
    active &&
    wallet &&
    ((active.host.wallet === wallet && active.host.paid) ||
      (active.guest?.wallet === wallet && active.guest.paid));

  const needOpponent = active?.status === "open";
  const canLock =
    active &&
    wallet &&
    (active.status === "open" || active.status === "full") &&
    (active.host.wallet === wallet || active.guest?.wallet === wallet) &&
    !myPaid;

  return (
    <section className="pvp" id="pvp">
      <header className="section-head">
        <h2>Live PvP Arena</h2>
        <p>
          Head-to-head stakes in {TOKEN.ticker}. Both buy-ins route to treasury{" "}
          <code className="inline-ca">
            {TREASURY_WALLET
              ? `${TREASURY_WALLET.slice(0, 6)}…${TREASURY_WALLET.slice(-4)}`
              : "(unset)"}
          </code>
          . Winner is paid the pot minus an{" "}
          {(ECONOMY.houseFeeBps / 100).toFixed(1)}% house cut that stays with
          you.
        </p>
      </header>

      {!economyReady() && (
        <p className="economy-banner">
          Add <code>NEXT_PUBLIC_TREASURY_WALLET</code> (your Solana address) and
          optionally <code>TREASURY_PRIVATE_KEY</code> for automatic winner
          payouts. Redeploy on Vercel after setting env vars.
        </p>
      )}

      <div className="pvp-layout">
        <div className="pvp-controls">
          <fieldset>
            <legend>Stake ({TOKEN.ticker})</legend>
            <div className="chip-toggles">
              {ECONOMY.stakePresets.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`toggle ${stake === s ? "active" : ""}`}
                  onClick={() => setStake(s)}
                >
                  {s.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="fee-note">
              Pot { (stake * 2).toLocaleString() } · House keeps{" "}
              {houseCut(stake).toLocaleString()} · Winner{" "}
              {winnerPayout(stake).toLocaleString()}
            </p>
          </fieldset>

          <button
            type="button"
            className="btn-primary"
            disabled={!connected || busy || !economyReady()}
            onClick={() => void createMatch()}
          >
            Create PvP Race
          </button>

          <p className="store-note">
            Lobby store: {storeMode}
            {storeMode === "memory"
              ? " — add Upstash Redis on Vercel for multi-instance lobbies"
              : ""}
          </p>

          <fieldset>
            <legend>Open rails</legend>
            <ul className="lobby-list">
              {matches.length === 0 && (
                <li className="muted">No open matches — create one.</li>
              )}
              {matches.map((m) => (
                <li key={m.id}>
                  <div>
                    <strong>{m.stake.toLocaleString()}</strong> {TOKEN.ticker}
                    <span className="muted">
                      {" "}
                      · {shortKey(m.host.wallet)} · {m.status}
                    </span>
                  </div>
                  {m.status === "open" &&
                    wallet &&
                    m.host.wallet !== wallet && (
                      <button
                        type="button"
                        className="btn-ghost small"
                        disabled={busy}
                        onClick={() => void joinMatch(m.id)}
                      >
                        Join
                      </button>
                    )}
                  <button
                    type="button"
                    className="btn-ghost small"
                    onClick={() => setActive(m)}
                  >
                    Watch
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          {error && <p className="race-result error">{error}</p>}
        </div>

        <div className="pvp-stage">
          {!active && (
            <p className="muted center">
              Create or join a match to lock live {TOKEN.ticker} stakes.
            </p>
          )}
          {active && (
            <>
              <div className="pvp-horses">
                <div>
                  <span className="eyebrow">Host</span>
                  <AnimatedHorse horse={active.host.horse} size="md" racing={active.status === "settling"} />
                  <p>
                    {active.host.horse.name} · {shortKey(active.host.wallet)}
                    {active.host.paid ? " · paid" : " · awaiting pay"}
                  </p>
                </div>
                <div className="vs">VS</div>
                <div>
                  <span className="eyebrow">Challenger</span>
                  {active.guest ? (
                    <>
                      <AnimatedHorse
                        horse={active.guest.horse}
                        size="md"
                        racing={active.status === "settling"}
                      />
                      <p>
                        {active.guest.horse.name} ·{" "}
                        {shortKey(active.guest.wallet)}
                        {active.guest.paid ? " · paid" : " · awaiting pay"}
                      </p>
                    </>
                  ) : (
                    <p className="muted">Waiting for challenger…</p>
                  )}
                </div>
              </div>

              <div className="pvp-actions">
                {needOpponent && (
                  <p className="muted">Share the lobby — waiting on a joiner.</p>
                )}
                {canLock && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => void lockStake()}
                  >
                    Pay {active.stake.toLocaleString()} {TOKEN.ticker} to
                    treasury
                  </button>
                )}
                {myPaid && active.status !== "settled" && (
                  <p className="muted">Stake locked. Waiting on opponent / settle…</p>
                )}
                {active.status === "settled" && (
                  <div className="settle-box">
                    <p className="race-result">
                      Winner {active.winnerWallet ? shortKey(active.winnerWallet) : "—"}
                    </p>
                    <p className="muted">{active.payoutNote}</p>
                    {active.payoutTx && (
                      <a
                        href={`https://solscan.io/tx/${active.payoutTx}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Payout tx
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
