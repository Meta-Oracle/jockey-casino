# Jockey Casino

SVG-animated Solana racing utility for **$JOCKEY** with live PvP betting.

**Mint / CA:** `7S7c3aq7e8j9srBHWtrNuhhVqfiFK881EhMcL2Vfpump`

## Economy

| Action | Token flow |
| --- | --- |
| Live upgrades | 100% → your treasury |
| Solo race entry | 100% → your treasury |
| PvP buy-in (both players) | Stakes → treasury; winner paid pot minus house cut; **house cut stays in treasury** |

## Setup (required for live play)

1. Copy `.env.example` → `.env.local`
2. Set **`NEXT_PUBLIC_TREASURY_WALLET`** to your Solana address (receives all spends)
3. Set **`TREASURY_PRIVATE_KEY`** (same wallet, base58 or JSON array) so the server can auto-pay PvP winners
4. Recommended: Helius/QuickNode RPC + Upstash Redis for Vercel lobbies

```bash
npm install
npm run dev
```

## Vercel

1. Import the GitHub repo
2. Add the same env vars in Project → Settings → Environment Variables
3. Deploy

Without `TREASURY_PRIVATE_KEY`, stakes still accumulate in your treasury; winner payouts must be sent manually (match UI shows the winner).

## Security

- Never commit private keys
- Prefer a dedicated hot treasury with limited balance for payouts
- Upstash Redis is recommended in production so PvP match state is shared across serverless instances
