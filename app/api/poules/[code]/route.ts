import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const poule = await prisma.poule.findUnique({
    where: { code },
    include: {
      deelnemers: {
        include: { voorspellingen: true },
      },
    },
  });

  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const resultaten = await prisma.resultaat.findMany();
  const resultatenMap: Record<string, { thuis: number; uit: number }> = {};
  resultaten.forEach((r) => {
    resultatenMap[r.wedstrijdId] = { thuis: r.thuis, uit: r.uit };
  });

  return NextResponse.json({ ...poule, resultaten: resultatenMap });
}
