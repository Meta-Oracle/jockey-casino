"use client";

import { useState } from "react";
import { SHORT_CA, TOKEN } from "@/lib/token";

export default function ContractBar() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(TOKEN.ca);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="contract-bar">
      <span className="contract-label">CA</span>
      <code className="contract-ca" title={TOKEN.ca}>
        <span className="ca-full">{TOKEN.ca}</span>
        <span className="ca-short">{SHORT_CA}</span>
      </code>
      <button type="button" className="btn-ghost" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
      <a
        className="btn-ghost"
        href={TOKEN.dexUrl}
        target="_blank"
        rel="noreferrer"
      >
        Buy
      </a>
    </div>
  );
}
