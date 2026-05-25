import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { berekenPunten, berekenMinuutAfstand, heeftCorrectEersteDoelpuntenmaker } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code } = await params;
  const poule = await prisma.poule.findUnique({
    where: { code },
    include: {
      deelnemers: { include: { voorspellingen: true } },
    },
  });
  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (poule.organisatorId !== authUser.id) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const resultaten = await prisma.resultaat.findMany();
  const resultatenMap: Record<string, { thuis: number; uit: number }> = {};
  resultaten.forEach((r) => { resultatenMap[r.wedstrijdId] = { thuis: r.thuis, uit: r.uit }; });

  const gesorteerd = poule.deelnemers
    .map((d) => ({
      userId: d.userId,
      punten: berekenPunten(d.voorspellingen, resultatenMap, d, poule),
      correctDoelpuntenmaker: heeftCorrectEersteDoelpuntenmaker(d, poule),
      minuutAfstand: berekenMinuutAfstand(d.eersteDoelpuntenminuutVoorspelling, poule.eersteDoelpuntenminuutResultaat),
    }))
    .sort((a, b) => {
      if (b.punten !== a.punten) return b.punten - a.punten;
      if (a.correctDoelpuntenmaker !== b.correctDoelpuntenmaker) return a.correctDoelpuntenmaker ? -1 : 1;
      return a.minuutAfstand - b.minuutAfstand;
    });

  const winnaar = gesorteerd[0];
  if (!winnaar) return NextResponse.json({ error: "Geen deelnemers" }, { status: 400 });

  await prisma.$transaction([
    prisma.poule.update({
      where: { code },
      data: { afgerond: true, winnaarId: winnaar.userId },
    }),
    prisma.user.update({
      where: { id: winnaar.userId },
      data: { aantalWinsten: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true, winnaarId: winnaar.userId });
}
