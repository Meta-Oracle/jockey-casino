"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import RaceVisualizer, {
  PaddockPreview,
} from "@/components/RaceVisualizer";
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
  const [serverSkewMs, setServerSkewMs] = useState(0);
  const syncing = useRef(false);

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
    const data = (await res.json()) as {
      match: PvpMatch;
      serverNow?: number;
    };
    if (typeof data.serverNow === "number") {
      setServerSkewMs(data.serverNow - Date.now());
    }
    setActive(data.match);
  }, [active?.id]);

  // Lobby poll
  useEffect(() => {
    void refreshLobby();
    const id = window.setInterval(() => void refreshLobby(), 3500);
    return () => window.clearInterval(id);
  }, [refreshLobby]);

  // Match netcode — faster while racing
  useEffect(() => {
    if (!active) return;
    if (active.status === "settled") return;
    const ms =
      active.status === "racing"
        ? 500
        : active.status === "full"
          ? 1200
          : 2000;
    const id = window.setInterval(() => void refreshActive(), ms);
    return () => window.clearInterval(id);
  }, [active, refreshActive]);

  // Sync latest horse build into the match (stats/upgrades/gear)
  useEffect(() => {
    if (!wallet || !active) return;
    if (active.status !== "open" && active.status !== "full") return;
    const isPlayer =
      active.host.wallet === wallet || active.guest?.wallet === wallet;
    if (!isPlayer) return;
    const paid =
      (active.host.wallet === wallet && active.host.paid) ||
      (active.guest?.wallet === wallet && active.guest.paid);
    if (paid) return;

    const timer = window.setTimeout(() => {
      if (syncing.current) return;
      syncing.current = true;
      void fetch("/api/pvp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: active.id, wallet, horse }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as { match: PvpMatch };
          setActive(data.match);
        })
        .finally(() => {
          syncing.current = false;
        });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    horse,
    wallet,
    active?.id,
    active?.status,
    active?.host.paid,
    active?.guest?.paid,
    active?.host.wallet,
    active?.guest?.wallet,
  ]);

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
      // Final horse sync before paying
      await fetch("/api/pvp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: active.id, wallet, horse }),
      });

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

  const onRaceFinished = useCallback(() => {
    void fetch("/api/pvp/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: active?.id }),
    })
      .then((r) => r.json())
      .then((data: { match?: PvpMatch; serverNow?: number }) => {
        if (data.match) setActive(data.match);
        if (typeof data.serverNow === "number") {
          setServerSkewMs(data.serverNow - Date.now());
        }
      });
  }, [active?.id]);

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

  const showVisualizer =
    active &&
    active.race &&
    (active.status === "racing" ||
      active.status === "settling" ||
      active.status === "settled");

  return (
    <section className="pvp" id="pvp">
      <header className="section-head">
        <h2>Live PvP Arena</h2>
        <p>
          Enter the rail with your live build — breed, upgrades, and silks feed
          the race sim. Horses run the track; {TOKEN.ticker} stakes settle on
          finish.
        </p>
      </header>

      {!economyReady() && (
        <p className="economy-banner">
          Add <code>NEXT_PUBLIC_TREASURY_WALLET</code> (your Solana address) and
          optionally <code>TREASURY_PRIVATE_KEY</code> for automatic winner
          payouts. Redeploy on Vercel after setting env vars.
        </p>
      )}

      {showVisualizer && active && (
        <RaceVisualizer
          match={active}
          serverSkewMs={serverSkewMs}
          onFinished={onRaceFinished}
        />
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
              Pot {(stake * 2).toLocaleString()} · House keeps{" "}
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
            Net: {storeMode}
            {storeMode === "memory"
              ? " — Upstash Redis recommended for multi-instance Vercel"
              : " · redis sync live"}
            {active?.status === "racing" ? " · race poll 500ms" : ""}
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
                    {m.status === "racing" ? "Watch live" : "Enter"}
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
              Create or join — your stable build syncs into the arena before
              stakes lock.
            </p>
          )}

          {active && !showVisualizer && <PaddockPreview match={active} />}

          {active && (
            <div className="pvp-actions">
              {needOpponent && (
                <p className="muted">
                  Arena open — waiting on a challenger. Customize in Your Stable;
                  builds sync live until you pay.
                </p>
              )}
              {canLock && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => void lockStake()}
                >
                  Pay {active.stake.toLocaleString()} {TOKEN.ticker} · enter
                  gate
                </button>
              )}
              {myPaid && active.status === "full" && (
                <p className="muted">
                  Stake locked. Waiting for opponent payment to break…
                </p>
              )}
              {active.status === "racing" && (
                <p className="muted">Race live — horses running the rail.</p>
              )}
              {active.status === "settled" && (
                <div className="settle-box">
                  <p className="race-result">
                    Winner{" "}
                    {active.winnerWallet
                      ? shortKey(active.winnerWallet)
                      : "—"}
                    {active.race
                      ? ` · ${active.race.winner === "host" ? active.host.horse.name : active.guest?.horse.name}`
                      : ""}
                  </p>
                  {active.race && (
                    <p className="muted">
                      Clock: host {(active.race.host.finishMs / 1000).toFixed(2)}
                      s · guest{" "}
                      {(active.race.guest.finishMs / 1000).toFixed(2)}s · seed{" "}
                      {active.race.seed}
                    </p>
                  )}
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
              {TREASURY_WALLET && (
                <p className="fee-note">
                  Treasury {TREASURY_WALLET.slice(0, 6)}…
                  {TREASURY_WALLET.slice(-4)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
