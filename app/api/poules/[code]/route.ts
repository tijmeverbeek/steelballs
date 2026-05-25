import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const poule = await prisma.poule.findUnique({
    where: { code },
    include: {
      deelnemers: {
        include: {
          voorspellingen: true,
          user: { select: { gebruikersnaam: true, email: true } },
        },
      },
    },
  });

  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const [resultaten, tournamentStats] = await Promise.all([
    prisma.resultaat.findMany(),
    prisma.tournamentStat.findMany(),
  ]);

  const resultatenMap: Record<string, { thuis: number; uit: number }> = {};
  resultaten.forEach((r) => {
    resultatenMap[r.wedstrijdId] = { thuis: r.thuis, uit: r.uit };
  });

  const liveStats: Record<string, string> = {};
  tournamentStats.forEach((s) => { liveStats[s.type] = s.waarde; });

  return NextResponse.json({ ...poule, resultaten: resultatenMap, liveStats });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code } = await params;
  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  if (poule.organisatorId !== authUser.id) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.poule.update({
    where: { code },
    data: {
      ...(body.topscorerActief !== undefined && { topscorerActief: body.topscorerActief }),
      ...(body.geleKaartenActief !== undefined && { geleKaartenActief: body.geleKaartenActief }),
      ...(body.toernooiwinaarActief !== undefined && { toernooiwinaarActief: body.toernooiwinaarActief }),
      ...(body.eersteDoelpuntenmakerActief !== undefined && { eersteDoelpuntenmakerActief: body.eersteDoelpuntenmakerActief }),
      ...(body.eersteDoelpuntenminuutActief !== undefined && { eersteDoelpuntenminuutActief: body.eersteDoelpuntenminuutActief }),
      ...(body.topscorerResultaat !== undefined && { topscorerResultaat: body.topscorerResultaat || null }),
      ...(body.geleKaartenResultaat !== undefined && { geleKaartenResultaat: body.geleKaartenResultaat || null }),
      ...(body.toernooiwinaarResultaat !== undefined && { toernooiwinaarResultaat: body.toernooiwinaarResultaat || null }),
      ...(body.eersteDoelpuntenmakerResultaat !== undefined && { eersteDoelpuntenmakerResultaat: body.eersteDoelpuntenmakerResultaat || null }),
      ...(body.eersteDoelpuntenminuutResultaat !== undefined && { eersteDoelpuntenminuutResultaat: body.eersteDoelpuntenminuutResultaat ?? null }),
    },
  });

  return NextResponse.json({ success: true, poule: updated });
}
