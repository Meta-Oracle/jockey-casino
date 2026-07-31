import { NextResponse } from "next/server";
import { verifyTreasurySpend } from "@/lib/solana";
import { ECONOMY, economyReady } from "@/lib/token";

export const dynamic = "force-dynamic";

/** Verify an upgrade / solo-entry spend hit the treasury. */
export async function POST(req: Request) {
  if (!economyReady()) {
    return NextResponse.json(
      { error: "Treasury not configured" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    wallet?: string;
    signature?: string;
    kind?: "upgrade" | "solo";
  };

  if (!body.wallet || !body.signature || !body.kind) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const amount =
    body.kind === "upgrade" ? ECONOMY.upgradeCost : ECONOMY.soloEntryCost;
  const memoPrefix =
    body.kind === "upgrade" ? "jockey-upgrade:" : "jockey-solo:";

  const verified = await verifyTreasurySpend({
    signature: body.signature,
    expectedFrom: body.wallet,
    expectedHumanAmount: amount,
    memoIncludes: memoPrefix,
  });

  if (!verified.ok) {
    return NextResponse.json({ error: verified.reason }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    amount,
    signature: body.signature,
    routedTo: "treasury",
  });
}
