import { NextResponse } from "next/server";
import { getMatch } from "@/lib/pvp/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const match = await getMatch(id);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ match });
}
