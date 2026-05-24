import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { Voorspelling } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ code: string; deelnemerId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { deelnemerId } = await params;
  const {
    voorspellingen,
    topscorerVoorspelling,
    geleKaartenVoorspelling,
    toernooiwinaarVoorspelling,
  }: {
    voorspellingen: Voorspelling[];
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
  } = await req.json();

  const deelnemer = await prisma.deelnemer.findUnique({ where: { id: deelnemerId } });
  if (!deelnemer) return NextResponse.json({ error: "Deelnemer niet gevonden" }, { status: 404 });

  if (deelnemer.userId !== authUser.id) {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  await prisma.$transaction(
    voorspellingen.map((v) =>
      prisma.voorspelling.upsert({
        where: { deelnemerId_wedstrijdId: { deelnemerId, wedstrijdId: v.wedstrijdId } },
        update: { thuis: v.thuis, uit: v.uit },
        create: { deelnemerId, wedstrijdId: v.wedstrijdId, thuis: v.thuis, uit: v.uit },
      })
    )
  );

  const specialeUpdate: {
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
  } = {};
  if (topscorerVoorspelling !== undefined) specialeUpdate.topscorerVoorspelling = topscorerVoorspelling || null;
  if (geleKaartenVoorspelling !== undefined) specialeUpdate.geleKaartenVoorspelling = geleKaartenVoorspelling || null;
  if (toernooiwinaarVoorspelling !== undefined) specialeUpdate.toernooiwinaarVoorspelling = toernooiwinaarVoorspelling || null;
  if (Object.keys(specialeUpdate).length > 0) {
    await prisma.deelnemer.update({ where: { id: deelnemerId }, data: specialeUpdate });
  }

  return NextResponse.json({ success: true });
}
