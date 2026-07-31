"use client";

import { useEffect, useState, useTransition } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import AnimatedHorse from "@/components/AnimatedHorse";
import PvpArena from "@/components/PvpArena";
import { useSpendToTreasury } from "@/components/WalletBar";
import {
  BREEDS,
  DEFAULT_HORSE,
  MANE_STYLES,
  MAX_UPGRADE,
  STARTING_CHIPS,
  getBreed,
  getStats,
  loadSave,
  persistSave,
  runRace,
  type HorseConfig,
  type ManeStyle,
  type StatKey,
} from "@/lib/game";
import { ECONOMY, TOKEN, economyReady } from "@/lib/token";

const STATS: { key: StatKey; label: string }[] = [
  { key: "speed", label: "Speed" },
  { key: "stamina", label: "Stamina" },
  { key: "luck", label: "Luck" },
  { key: "grit", label: "Grit" },
];

const SILK_PRESETS = [
  { primary: "#c41e3a", secondary: "#f5f0e8" },
  { primary: "#0d4f8b", secondary: "#e8b84a" },
  { primary: "#0d6b4c", secondary: "#f5f0e8" },
  { primary: "#1a1a1a", secondary: "#e8b84a" },
  { primary: "#7a2e8a", secondary: "#f0d4a8" },
  { primary: "#e85d04", secondary: "#1a120c" },
];

export default function StableGame() {
  const { connected, publicKey } = useWallet();
  const spend = useSpendToTreasury();
  const [horse, setHorse] = useState<HorseConfig>(DEFAULT_HORSE);
  const [chips, setChips] = useState(STARTING_CHIPS);
  const [mode, setMode] = useState<"practice" | "live">("live");
  const [bet, setBet] = useState(10);
  const [racing, setRacing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const save = loadSave();
    setHorse(save.horse);
    setChips(save.chips);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistSave({ horse, chips });
  }, [horse, chips, hydrated]);

  const breed = getBreed(horse.breedId);
  const stats = getStats(horse);
  const live = mode === "live";

  function update(partial: Partial<HorseConfig>) {
    startTransition(() => {
      setHorse((h) => ({ ...h, ...partial }));
    });
  }

  async function upgrade(stat: StatKey) {
    if (horse.upgrades[stat] >= MAX_UPGRADE) return;

    if (!live) {
      if (chips < 1) return;
      setChips((c) => c - 1);
      setHorse((h) => ({
        ...h,
        upgrades: { ...h.upgrades, [stat]: h.upgrades[stat] + 1 },
      }));
      return;
    }

    if (!connected || !publicKey || !economyReady()) return;
    setBusy(true);
    setResult(null);
    try {
      const memo = `jockey-upgrade:${publicKey.toBase58()}:${stat}:${Date.now()}`;
      const signature = await spend(ECONOMY.upgradeCost, memo);
      const res = await fetch("/api/economy/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature,
          kind: "upgrade",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verify failed");

      setHorse((h) => ({
        ...h,
        upgrades: { ...h.upgrades, [stat]: h.upgrades[stat] + 1 },
      }));
      setResult(
        `Upgrade locked on-chain → treasury (+${stat}). Tx ${signature.slice(0, 8)}…`
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setBusy(false);
    }
  }

  function selectBreed(id: HorseConfig["breedId"]) {
    const b = getBreed(id);
    update({
      breedId: id,
      coat: b.coatOptions[0],
    });
  }

  async function race() {
    if (racing || busy) return;

    if (!live) {
      if (chips < bet) return;
      setRacing(true);
      setResult(null);
      setChips((c) => c - bet);
      window.setTimeout(() => {
        const outcome = runRace(horse, bet);
        setChips((c) => c + outcome.payout);
        setResult(
          `#${outcome.placed} — ${outcome.message}${
            outcome.payout ? ` (+${outcome.payout} chips)` : ""
          }`
        );
        setRacing(false);
      }, 2400);
      return;
    }

    if (!connected || !publicKey || !economyReady()) return;
    setRacing(true);
    setBusy(true);
    setResult(null);
    try {
      const memo = `jockey-solo:${publicKey.toBase58()}:${Date.now()}`;
      const signature = await spend(ECONOMY.soloEntryCost, memo);
      const res = await fetch("/api/economy/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature,
          kind: "solo",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Entry verify failed");

      await new Promise((r) => window.setTimeout(r, 1800));
      const outcome = runRace(horse, ECONOMY.soloEntryCost);
      setResult(
        `#${outcome.placed} — ${outcome.message} Entry ${ECONOMY.soloEntryCost.toLocaleString()} ${TOKEN.ticker} routed to treasury.`
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Race entry failed");
    } finally {
      setRacing(false);
      setBusy(false);
    }
  }

  return (
    <>
      <section className="stable" id="stable">
        <header className="section-head">
          <h2>Your Stable</h2>
          <p>
            Customize your mount. In live mode, upgrades and solo entries spend
            real {TOKEN.ticker} — 100% routed to the treasury wallet.
          </p>
        </header>

        <div className="mode-row">
          <button
            type="button"
            className={`toggle ${mode === "live" ? "active" : ""}`}
            onClick={() => setMode("live")}
          >
            Live {TOKEN.ticker}
          </button>
          <button
            type="button"
            className={`toggle ${mode === "practice" ? "active" : ""}`}
            onClick={() => setMode("practice")}
          >
            Practice chips
          </button>
          {live && (
            <span className="fee-note">
              Upgrade {ECONOMY.upgradeCost.toLocaleString()} · Solo entry{" "}
              {ECONOMY.soloEntryCost.toLocaleString()} {TOKEN.ticker}
            </span>
          )}
        </div>

        <div className="stable-layout">
          <div className="stable-preview">
            <div className={`preview-stage ${racing ? "racing" : ""}`}>
              <AnimatedHorse horse={horse} size="lg" racing={racing} />
              {racing && <div className="race-banner">Racing…</div>}
            </div>
            <div className="chip-row">
              {!live && (
                <>
                  <span className="chips">
                    Chips <strong>{chips}</strong>
                  </span>
                  <label className="bet-label">
                    Bet
                    <input
                      type="range"
                      min={5}
                      max={Math.max(5, Math.min(50, chips || 5))}
                      step={5}
                      value={Math.min(bet, chips || 5)}
                      onChange={(e) => setBet(Number(e.target.value))}
                      disabled={racing}
                    />
                    <span>{bet}</span>
                  </label>
                </>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={() => void race()}
                disabled={
                  racing ||
                  busy ||
                  (live
                    ? !connected || !economyReady()
                    : chips < bet)
                }
              >
                {live
                  ? `Solo Race (${ECONOMY.soloEntryCost.toLocaleString()} ${TOKEN.ticker})`
                  : "Enter Race"}
              </button>
            </div>
            {result && <p className="race-result">{result}</p>}
          </div>

          <div className="stable-controls">
            <fieldset>
              <legend>Name</legend>
              <input
                className="text-input"
                maxLength={18}
                value={horse.name}
                onChange={(e) => update({ name: e.target.value || "Unnamed" })}
              />
            </fieldset>

            <fieldset>
              <legend>Breed</legend>
              <div className="breed-grid">
                {BREEDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`breed-card ${
                      horse.breedId === b.id ? "active" : ""
                    }`}
                    onClick={() => selectBreed(b.id)}
                  >
                    <strong>{b.name}</strong>
                    <span>{b.tagline}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Coat</legend>
              <div className="swatch-row">
                {breed.coatOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch ${horse.coat === c ? "active" : ""}`}
                    style={{ background: c }}
                    aria-label={`Coat ${c}`}
                    onClick={() => update({ coat: c })}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Racing silks</legend>
              <div className="swatch-row">
                {SILK_PRESETS.map((s) => (
                  <button
                    key={s.primary + s.secondary}
                    type="button"
                    className={`swatch silk ${
                      horse.silkPrimary === s.primary &&
                      horse.silkSecondary === s.secondary
                        ? "active"
                        : ""
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${s.primary} 50%, ${s.secondary} 50%)`,
                    }}
                    aria-label="Silk colors"
                    onClick={() =>
                      update({
                        silkPrimary: s.primary,
                        silkSecondary: s.secondary,
                      })
                    }
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Mane</legend>
              <div className="chip-toggles">
                {MANE_STYLES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`toggle ${horse.mane === m.id ? "active" : ""}`}
                    onClick={() => update({ mane: m.id as ManeStyle })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                Upgrades ·{" "}
                {live
                  ? `${ECONOMY.upgradeCost.toLocaleString()} ${TOKEN.ticker} → treasury`
                  : "1 practice chip"}
              </legend>
              <div className="stat-list">
                {STATS.map(({ key, label }) => (
                  <div key={key} className="stat-row">
                    <div className="stat-meta">
                      <span>{label}</span>
                      <span className="stat-val">{stats[key]}</span>
                    </div>
                    <div className="stat-bar">
                      <i style={{ width: `${(stats[key] / 15) * 100}%` }} />
                    </div>
                    <button
                      type="button"
                      className="btn-ghost small"
                      disabled={
                        busy ||
                        horse.upgrades[key] >= MAX_UPGRADE ||
                        (live
                          ? !connected || !economyReady()
                          : chips < 1)
                      }
                      onClick={() => void upgrade(key)}
                    >
                      +{horse.upgrades[key]}/{MAX_UPGRADE}
                    </button>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </section>

      <PvpArena horse={horse} />
    </>
  );
}
