import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { isRondeGesloten, getWedstrijdenVoorRonde } from "@/lib/lms";

// GET: haal alle LMS picks + standings op voor de poule
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poule = await prisma.poule.findUnique({
    where: { code },
    include: {
      deelnemers: {
        include: {
          user: { select: { gebruikersnaam: true, email: true } },
          lmsPicks: true,
        },
      },
    },
  });
  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  return NextResponse.json(poule);
}

// POST: submit een pick voor een ronde
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code } = await params;
  const { rondeNr, teamCode, wedstrijdId } = await req.json();

  if (!rondeNr || !teamCode || !wedstrijdId) {
    return NextResponse.json({ error: "rondeNr, teamCode en wedstrijdId zijn verplicht" }, { status: 400 });
  }

  // Deadline check: mag de ronde nog worden ingediend?
  if (isRondeGesloten(rondeNr)) {
    return NextResponse.json({ error: "De deadline voor deze ronde is verstreken" }, { status: 403 });
  }

  // Verify the wedstrijd belongs to this round (hardcoded OR DB knockout)
  const hardcodedWedstrijden = getWedstrijdenVoorRonde(rondeNr);
  const lmsWedstrijden = hardcodedWedstrijden.length === 0
    ? await prisma.lmsWedstrijd.findMany({ where: { rondeNr } })
    : [];
  const geldig =
    hardcodedWedstrijden.find((w) => w.id === wedstrijdId) ||
    lmsWedstrijden.find((w) => w.id === wedstrijdId);
  if (!geldig) {
    return NextResponse.json({ error: "Wedstrijd hoort niet bij deze ronde" }, { status: 400 });
  }

  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule || poule.soort !== "lms") {
    return NextResponse.json({ error: "Niet gevonden of geen LMS poule" }, { status: 404 });
  }

  const deelnemer = await prisma.deelnemer.findUnique({
    where: { userId_pouleId: { userId: authUser.id, pouleId: poule.id } },
    include: { lmsPicks: true },
  });
  if (!deelnemer) return NextResponse.json({ error: "Niet deelnemer van deze poule" }, { status: 403 });
  if (!deelnemer.lmsActief) return NextResponse.json({ error: "Je bent uitgeschakeld" }, { status: 403 });

  // Check: round progression — need to have won the previous round
  if (rondeNr > 1) {
    const vorigePick = deelnemer.lmsPicks.find((p) => p.rondeNr === rondeNr - 1);
    if (!vorigePick || vorigePick.uitkomst !== "win") {
      return NextResponse.json({ error: `Je moet ronde ${rondeNr - 1} overleven om door te gaan naar ronde ${rondeNr}` }, { status: 403 });
    }
  }

  // Check: team not already used in a different round
  const gebruiktTeams = deelnemer.lmsPicks
    .filter((p) => p.rondeNr !== rondeNr)
    .map((p) => p.teamCode);
  if (gebruiktTeams.includes(teamCode)) {
    return NextResponse.json({ error: "Je hebt dit team al eerder gekozen" }, { status: 400 });
  }

  const pick = await prisma.lmsPick.upsert({
    where: { deelnemerId_rondeNr: { deelnemerId: deelnemer.id, rondeNr } },
    update: { teamCode, wedstrijdId, uitkomst: null },
    create: { deelnemerId: deelnemer.id, rondeNr, teamCode, wedstrijdId, uitkomst: null },
  });

  return NextResponse.json({ success: true, pick });
}
