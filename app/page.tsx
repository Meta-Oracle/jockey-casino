"use client";

import { useMemo } from "react";
import AnimatedHorse from "@/components/AnimatedHorse";
import ContractBar from "@/components/ContractBar";
import StableGame from "@/components/StableGame";
import TrackHeroBackdrop from "@/components/TrackHeroBackdrop";
import { DEFAULT_HORSE } from "@/lib/game";
import { TOKEN } from "@/lib/token";

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
          <a href={TOKEN.dexUrl} target="_blank" rel="noreferrer">
            Trade
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <TrackHeroBackdrop />
        <div className="hero-content">
          <p className="brand-mark">JOCKEY</p>
          <h1>Race the rail. Own the utility.</h1>
          <p className="lede">
            SVG-animated Solana racing casino — breed custom mounts, upgrade
            bloodlines, and ride {TOKEN.ticker} as the chip behind every purse.
          </p>
          <div className="cta-row">
            <a className="btn-primary" href="#stable">
              Enter the Stable
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
          <h2>Token utility</h2>
          <p>
            {TOKEN.ticker} fuels the paddock — entry stakes, upgrades, and
            finishing purses on Solana.
          </p>
        </header>
        <ul className="utility-list">
          <li>
            <strong>Race stakes</strong>
            <span>Chip into animated heats; place/show/win purses recycle value.</span>
          </li>
          <li>
            <strong>Bloodline upgrades</strong>
            <span>Spend chips to push speed, stamina, luck, and grit.</span>
          </li>
          <li>
            <strong>Personal silks</strong>
            <span>Breeds, coats, manes, and jockey colors — your stable identity.</span>
          </li>
          <li>
            <strong>On-chain presence</strong>
            <span>
              Verified mint on {TOKEN.chain}. Trade freely, play locally, keep
              the CA close.
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
          Entertainment utility demo. Not financial advice. DYOR. CA{" "}
          <code>{TOKEN.ca}</code>
        </p>
      </footer>
    </main>
  );
}
