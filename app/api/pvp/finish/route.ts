import { NextResponse } from "next/server";
import { getMatchFresh } from "@/lib/pvp/settle";

export const dynamic = "force-dynamic";

/** Client pings when local visualizer finishes — settles if wall time elapsed. */
export async function POST(req: Request) {
  const body = (await req.json()) as { matchId?: string };
  if (!body.matchId) {
    return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
  }
  const match = await getMatchFresh(body.matchId);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ match, serverNow: Date.now() });
}
