import { NextResponse } from "next/server";
import { getMatchFresh } from "@/lib/pvp/settle";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const match = await getMatchFresh(id);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    match,
    serverNow: Date.now(),
  });
}
