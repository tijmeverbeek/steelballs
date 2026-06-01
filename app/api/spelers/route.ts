import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSpelers } from "@/lib/players";

export const dynamic = "force-dynamic";

const POSITIE_VOLGORDE: Record<string, number> = { AAN: 0, MID: 1, VER: 2, DOE: 3 };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const soort = searchParams.get("soort") ?? "wk";

  const rows = await prisma.speler.findMany({
    where: { soort },
    select: { naam: true, positie: true, team: true },
  });

  if (rows.length > 0) {
    rows.sort((a, b) => {
      const pa = POSITIE_VOLGORDE[a.positie] ?? 99;
      const pb = POSITIE_VOLGORDE[b.positie] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.naam.localeCompare(b.naam);
    });
    return NextResponse.json(rows);
  }

  // Fall back to static list (covers cl_finale and pre-sync WK)
  return NextResponse.json(getSpelers(soort));
}
