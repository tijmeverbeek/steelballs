import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const POSITIE_VOLGORDE: Record<string, number> = { AAN: 0, MID: 1, VER: 2, DOE: 3 };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const soort = searchParams.get("soort") ?? "wk";
  const teamsParam = searchParams.get("teams");
  const teamCodes = teamsParam ? teamsParam.split(",").filter(Boolean) : null;

  const rows = await prisma.speler.findMany({
    where: { soort, ...(teamCodes ? { team: { in: teamCodes } } : {}) },
    select: { naam: true, positie: true, team: true },
  });

  rows.sort((a, b) => {
    const pa = POSITIE_VOLGORDE[a.positie] ?? 99;
    const pb = POSITIE_VOLGORDE[b.positie] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.naam.localeCompare(b.naam);
  });

  return NextResponse.json(rows);
}
