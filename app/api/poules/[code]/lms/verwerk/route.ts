import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { getWedstrijdenVoorRonde } from "@/lib/lms";
import { getWedstrijd } from "@/lib/matches";

// POST: verwerk een LMS ronde — bepaal uitkomsten o.b.v. wedstrijdresultaten
// en schakelt spelers uit die hebben verloren of gelijk gespeeld
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code } = await params;
  const { rondeNr }: { rondeNr: number } = await req.json();

  const poule = await prisma.poule.findUnique({
    where: { code },
    include: {
      deelnemers: {
        include: { lmsPicks: true },
      },
    },
  });

  if (!poule || poule.soort !== "lms") {
    return NextResponse.json({ error: "Niet gevonden of geen LMS poule" }, { status: 404 });
  }
  if (poule.organisatorId !== authUser.id) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  // Haal alle wedstrijdresultaten op voor deze ronde
  const rondeWedstrijden = getWedstrijdenVoorRonde(rondeNr);
  const wedstrijdIds = rondeWedstrijden.map((w) => w.id);
  const resultaten = await prisma.resultaat.findMany({
    where: { wedstrijdId: { in: wedstrijdIds } },
  });
  const resultatenMap = Object.fromEntries(
    resultaten.map((r) => [r.wedstrijdId, { thuis: r.thuis, uit: r.uit }])
  );

  const updates: Promise<unknown>[] = [];
  let verwerkt = 0;
  let ontbreekt = 0;

  for (const deelnemer of poule.deelnemers) {
    const pick = deelnemer.lmsPicks.find((p) => p.rondeNr === rondeNr);
    if (!pick) continue;

    const resultaat = resultatenMap[pick.wedstrijdId];
    if (!resultaat) { ontbreekt++; continue; }

    const wedstrijd = getWedstrijd(pick.wedstrijdId);
    if (!wedstrijd) continue;

    // Bepaal of het gekozen team thuis of uit speelde
    const isThuis = wedstrijd.thuis.code === pick.teamCode;
    const teamDoelpunten = isThuis ? resultaat.thuis : resultaat.uit;
    const tegenstander = isThuis ? resultaat.uit : resultaat.thuis;

    let uitkomst: "win" | "verlies" | "gelijk";
    if (teamDoelpunten > tegenstander) uitkomst = "win";
    else if (teamDoelpunten < tegenstander) uitkomst = "verlies";
    else uitkomst = "gelijk";

    // Update pick uitkomst
    updates.push(
      prisma.lmsPick.update({
        where: { id: pick.id },
        data: { uitkomst },
      })
    );

    // Uitgeschakeld bij verlies of gelijkspel (standaard LMS-regel)
    if (uitkomst !== "win" && deelnemer.lmsActief) {
      updates.push(
        prisma.deelnemer.update({
          where: { id: deelnemer.id },
          data: { lmsActief: false, lmsUitgeschakeldRonde: rondeNr },
        })
      );
    }

    verwerkt++;
  }

  await Promise.all(updates);

  return NextResponse.json({ success: true, verwerkt, ontbreekt });
}
