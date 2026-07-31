"use client";

import { useMemo } from "react";
import AnimatedHorse from "@/components/AnimatedHorse";
import ContractBar from "@/components/ContractBar";
import StableGame from "@/components/StableGame";
import TrackHeroBackdrop from "@/components/TrackHeroBackdrop";
import WalletBar from "@/components/WalletBar";
import { DEFAULT_HORSE } from "@/lib/game";
import { ECONOMY, TOKEN, TREASURY_WALLET, economyReady } from "@/lib/token";

export default function HomePage() {
  const heroHorse = useMemo(
    () => ({
      ...DEFAULT_HORSE,
      name: "JOCKEY",
      breedId: "thoroughbred" as const,
      coat: "#2a1810",
      silkPrimary: "#e8b84a",
      silkSecondary: "#c41e3a",
      mane: "flowing" as const,
    }),
    []
  );

  return (
    <main>
      <nav className="nav">
        <a className="nav-brand" href="#top">
          JOCKEY
        </a>
        <div className="nav-links">
          <a href="#utility">Utility</a>
          <a href="#stable">Stable</a>
          <a href="#pvp">PvP</a>
          <a href={TOKEN.dexUrl} target="_blank" rel="noreferrer">
            Trade
          </a>
          <WalletBar />
        </div>
      </nav>

      <section className="hero" id="top">
        <TrackHeroBackdrop />
        <div className="hero-content">
          <p className="brand-mark">JOCKEY</p>
          <h1>Live rails. Real token economy.</h1>
          <p className="lede">
            PvP stakes, upgrades, and entries settle in {TOKEN.ticker}. Every
            in-game spend routes on-chain to the treasury — the house cut stays
            yours.
          </p>
          <div className="cta-row">
            <a className="btn-primary" href="#pvp">
              Enter PvP Arena
            </a>
            <a
              className="btn-outline"
              href={TOKEN.dexUrl}
              target="_blank"
              rel="noreferrer"
            >
              Buy {TOKEN.ticker}
            </a>
          </div>
          <ContractBar />
        </div>
        <div className="hero-horse">
          <AnimatedHorse horse={heroHorse} size="hero" racing />
        </div>
      </section>

      <section className="utility" id="utility">
        <header className="section-head">
          <h2>On-chain utility</h2>
          <p>
            {TOKEN.ticker} is the only in-game currency for live play. Spends
            hit the treasury ATA automatically.
          </p>
        </header>
        <ul className="utility-list">
          <li>
            <strong>PvP buy-ins</strong>
            <span>
              Both players transfer stake to treasury. Winner receives pot minus{" "}
              {(ECONOMY.houseFeeBps / 100).toFixed(0)}% house fee.
            </span>
          </li>
          <li>
            <strong>Upgrade burns (to treasury)</strong>
            <span>
              Each bloodline bump costs{" "}
              {ECONOMY.upgradeCost.toLocaleString()} {TOKEN.ticker} — 100%
              routed to you.
            </span>
          </li>
          <li>
            <strong>Solo entries</strong>
            <span>
              Practice against the field for{" "}
              {ECONOMY.soloEntryCost.toLocaleString()} {TOKEN.ticker} per gate.
            </span>
          </li>
          <li>
            <strong>Treasury sink</strong>
            <span>
              {economyReady()
                ? `Live · ${TREASURY_WALLET.slice(0, 8)}…${TREASURY_WALLET.slice(-6)}`
                : "Set NEXT_PUBLIC_TREASURY_WALLET before deploy"}
            </span>
          </li>
        </ul>
        <div className="token-panel">
          <div>
            <span className="eyebrow">Contract address</span>
            <code className="ca-block">{TOKEN.ca}</code>
          </div>
          <div className="token-links">
            <a href={TOKEN.dexUrl} target="_blank" rel="noreferrer">
              pump.fun
            </a>
            <a href={TOKEN.birdeyeUrl} target="_blank" rel="noreferrer">
              Birdeye
            </a>
            <a href={TOKEN.solscanUrl} target="_blank" rel="noreferrer">
              Solscan
            </a>
          </div>
        </div>
      </section>

      <StableGame />

      <footer className="footer">
        <span className="nav-brand">JOCKEY</span>
        <p>
          Live utility entertainment on Solana. Not financial advice. DYOR.
          Gambling involves risk. CA <code>{TOKEN.ca}</code>
        </p>
      </footer>
    </main>
  );
}
