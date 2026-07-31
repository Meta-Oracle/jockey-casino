"use client";

import { useEffect, useState, useTransition } from "react";
import AnimatedHorse from "@/components/AnimatedHorse";
import {
  BREEDS,
  DEFAULT_HORSE,
  MANE_STYLES,
  MAX_UPGRADE,
  STARTING_CHIPS,
  UPGRADE_COST,
  getBreed,
  getStats,
  loadSave,
  persistSave,
  runRace,
  type HorseConfig,
  type ManeStyle,
  type StatKey,
} from "@/lib/game";
import { TOKEN } from "@/lib/token";

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
  const [horse, setHorse] = useState<HorseConfig>(DEFAULT_HORSE);
  const [chips, setChips] = useState(STARTING_CHIPS);
  const [bet, setBet] = useState(10);
  const [racing, setRacing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
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

  function update(partial: Partial<HorseConfig>) {
    startTransition(() => {
      setHorse((h) => ({ ...h, ...partial }));
    });
  }

  function upgrade(stat: StatKey) {
    if (chips < UPGRADE_COST) return;
    if (horse.upgrades[stat] >= MAX_UPGRADE) return;
    setChips((c) => c - UPGRADE_COST);
    setHorse((h) => ({
      ...h,
      upgrades: { ...h.upgrades, [stat]: h.upgrades[stat] + 1 },
    }));
  }

  function selectBreed(id: HorseConfig["breedId"]) {
    const b = getBreed(id);
    update({
      breedId: id,
      coat: b.coatOptions[0],
    });
  }

  function race() {
    if (racing || chips < bet) return;
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
  }

  return (
    <section className="stable" id="stable">
      <header className="section-head">
        <h2>Your Stable</h2>
        <p>
          Breed, silk, and upgrade your mount. Race for chips — the utility
          loop behind {TOKEN.ticker}.
        </p>
      </header>

      <div className="stable-layout">
        <div className="stable-preview">
          <div className={`preview-stage ${racing ? "racing" : ""}`}>
            <AnimatedHorse
              horse={horse}
              size="lg"
              racing={racing}
            />
            {racing && <div className="race-banner">Racing…</div>}
          </div>
          <div className="chip-row">
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
            <button
              type="button"
              className="btn-primary"
              onClick={race}
              disabled={racing || chips < bet}
            >
              Enter Race
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
            <legend>Upgrades · {UPGRADE_COST} chip each</legend>
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
                      chips < UPGRADE_COST ||
                      horse.upgrades[key] >= MAX_UPGRADE
                    }
                    onClick={() => upgrade(key)}
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
  );
}
