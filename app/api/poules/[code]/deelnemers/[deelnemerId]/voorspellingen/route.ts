import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { Voorspelling } from "@/lib/types";
import { getWedstrijdenVoorSoort } from "@/lib/matches";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ code: string; deelnemerId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code, deelnemerId } = await params;
  const {
    voorspellingen,
    topscorerVoorspelling,
    geleKaartenVoorspelling,
    toernooiwinaarVoorspelling,
    eersteDoelpuntenmakerVoorspelling,
    eersteDoelpuntenminuutVoorspelling,
  }: {
    voorspellingen: Voorspelling[];
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
    eersteDoelpuntenmakerVoorspelling?: string | null;
    eersteDoelpuntenminuutVoorspelling?: number | null;
  } = await req.json();

  const deelnemer = await prisma.deelnemer.findUnique({
    where: { id: deelnemerId },
    include: { poule: { select: { soort: true } } },
  });
  if (!deelnemer) return NextResponse.json({ error: "Deelnemer niet gevonden" }, { status: 404 });
  if (deelnemer.userId !== authUser.id) return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });

  // Verify poule code matches deelnemer
  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule || poule.id !== deelnemer.pouleId) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const now = new Date();
  const wedstrijdenMap = new Map(
    getWedstrijdenVoorSoort(poule.soort ?? "wk").map((w) => [w.id, w])
  );

  // Only save predictions for matches that haven't started yet
  const geldige = voorspellingen.filter((v) => {
    const w = wedstrijdenMap.get(v.wedstrijdId);
    if (!w) return false;
    return now < new Date(`${w.datum}T${w.tijd}:00+02:00`);
  });

  if (geldige.length > 0) {
    await prisma.$transaction(
      geldige.map((v) =>
        prisma.voorspelling.upsert({
          where: { deelnemerId_wedstrijdId: { deelnemerId, wedstrijdId: v.wedstrijdId } },
          update: { thuis: v.thuis, uit: v.uit },
          create: { deelnemerId, wedstrijdId: v.wedstrijdId, thuis: v.thuis, uit: v.uit },
        })
      )
    );
  }

  // Bonus picks (eersteDoelpuntenmaker, minuut) are also locked after kickoff
  const lockWedstrijdId = poule.soort === "nl_oefen" ? "NL1" : "CL1";
  const lockWedstrijd = wedstrijdenMap.get(lockWedstrijdId);
  const clGestart = lockWedstrijd ? now >= new Date(`${lockWedstrijd.datum}T${lockWedstrijd.tijd}:00+02:00`) : false;

  const specialeUpdate: {
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
    eersteDoelpuntenmakerVoorspelling?: string | null;
    eersteDoelpuntenminuutVoorspelling?: number | null;
  } = {};
  if (topscorerVoorspelling !== undefined) specialeUpdate.topscorerVoorspelling = topscorerVoorspelling || null;
  if (geleKaartenVoorspelling !== undefined) specialeUpdate.geleKaartenVoorspelling = geleKaartenVoorspelling || null;
  if (toernooiwinaarVoorspelling !== undefined) specialeUpdate.toernooiwinaarVoorspelling = toernooiwinaarVoorspelling || null;
  if (!clGestart) {
    if (eersteDoelpuntenmakerVoorspelling !== undefined) specialeUpdate.eersteDoelpuntenmakerVoorspelling = eersteDoelpuntenmakerVoorspelling || null;
    if (eersteDoelpuntenminuutVoorspelling !== undefined) specialeUpdate.eersteDoelpuntenminuutVoorspelling = eersteDoelpuntenminuutVoorspelling ?? null;
  }
  if (Object.keys(specialeUpdate).length > 0) {
    await prisma.deelnemer.update({ where: { id: deelnemerId }, data: specialeUpdate });
  }

  return NextResponse.json({ success: true });
}
