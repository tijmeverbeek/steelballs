import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Voorspelling } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ code: string; deelnemerId: string }> }
) {
  const { deelnemerId } = await params;
  const { voorspellingen }: { voorspellingen: Voorspelling[] } = await req.json();

  const deelnemer = await prisma.deelnemer.findUnique({ where: { id: deelnemerId } });
  if (!deelnemer) return NextResponse.json({ error: "Deelnemer niet gevonden" }, { status: 404 });

  await prisma.$transaction(
    voorspellingen.map((v) =>
      prisma.voorspelling.upsert({
        where: { deelnemerId_wedstrijdId: { deelnemerId, wedstrijdId: v.wedstrijdId } },
        update: { thuis: v.thuis, uit: v.uit },
        create: { deelnemerId, wedstrijdId: v.wedstrijdId, thuis: v.thuis, uit: v.uit },
      })
    )
  );

  return NextResponse.json({ success: true });
}
