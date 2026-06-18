import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { getWedstrijdenVoorRonde } from "@/lib/lms";

export const dynamic = "force-dynamic";

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

  // Hardcoded groepsfase wedstrijden + DB knockout wedstrijden voor deze ronde
  const hardcodedWedstrijden = getWedstrijdenVoorRonde(rondeNr);
  const lmsWedstrijden = await prisma.lmsWedstrijd.findMany({ where: { rondeNr } });

  // Unified wedstrijdId → { thuisCode, uitCode } map
  const wedstrijdMap: Record<string, { thuisCode: string; uitCode: string }> = {};
  hardcodedWedstrijden.forEach((w) => { wedstrijdMap[w.id] = { thuisCode: w.thuis.code, uitCode: w.uit.code }; });
  lmsWedstrijden.forEach((w) => { wedstrijdMap[w.id] = { thuisCode: w.thuisCode, uitCode: w.uitCode }; });

  const alleWedstrijdIds = Object.keys(wedstrijdMap);
  const resultaten = await prisma.resultaat.findMany({
    where: { wedstrijdId: { in: alleWedstrijdIds } },
  });
  const resultatenMap = Object.fromEntries(
    resultaten.map((r) => [r.wedstrijdId, { thuis: r.thuis, uit: r.uit }])
  );

  const updates: (() => Promise<unknown>)[] = [];
  let verwerkt = 0;
  let ontbreekt = 0;

  for (const deelnemer of poule.deelnemers) {
    if (!(deelnemer.lmsActief ?? true)) continue; // al uitgeschakeld

    const pick = deelnemer.lmsPicks.find((p) => p.rondeNr === rondeNr);
    if (!pick) {
      // Geen pick gedaan → uitschakelen
      updates.push(() =>
        prisma.deelnemer.update({
          where: { id: deelnemer.id },
          data: { lmsActief: false, lmsUitgeschakeldRonde: rondeNr },
        })
      );
      verwerkt++;
      continue;
    }

    const resultaat = resultatenMap[pick.wedstrijdId];
    if (!resultaat) { ontbreekt++; continue; }

    const wedstrijdInfo = wedstrijdMap[pick.wedstrijdId];
    if (!wedstrijdInfo) continue;

    const isThuis = wedstrijdInfo.thuisCode === pick.teamCode;
    const teamDoelpunten = isThuis ? resultaat.thuis : resultaat.uit;
    const tegenstander = isThuis ? resultaat.uit : resultaat.thuis;

    let uitkomst: "win" | "verlies" | "gelijk";
    if (teamDoelpunten > tegenstander) uitkomst = "win";
    else if (teamDoelpunten < tegenstander) uitkomst = "verlies";
    else uitkomst = "gelijk";

    updates.push(() =>
      prisma.lmsPick.update({ where: { id: pick.id }, data: { uitkomst } })
    );

    if (uitkomst !== "win") {
      updates.push(() =>
        prisma.deelnemer.update({
          where: { id: deelnemer.id },
          data: { lmsActief: false, lmsUitgeschakeldRonde: rondeNr },
        })
      );
    }

    verwerkt++;
  }

  try {
    for (const fn of updates) await fn();
  } catch (err) {
    console.error("[lms/verwerk]", err);
    return NextResponse.json({ error: "Databasefout bij verwerken — controleer de resultaten en probeer opnieuw" }, { status: 500 });
  }

  return NextResponse.json({ success: true, verwerkt, ontbreekt });
}
