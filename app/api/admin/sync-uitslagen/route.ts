import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import {
  getAfgelopenEnLiveWedstrijden,
  getAfgelopenEnLiveWedstrijdenVoorLeague,
  API_NAAM_NAAR_CODE,
  UCL_LEAGUE_ID,
  UCL_SEASON,
  UCL_NAAM_NAAR_CODE,
} from "@/lib/football-api";
import { wedstrijden } from "@/lib/matches";
import { syncEersteDoelpuntenmakers } from "@/lib/sync-events";

export const dynamic = "force-dynamic";

async function syncFixtures(
  fixtures: Awaited<ReturnType<typeof getAfgelopenEnLiveWedstrijden>>,
  naamNaarCode: Record<string, string>
): Promise<number> {
  let bijgewerkt = 0;
  for (const fixture of fixtures) {
    const thuisCode = naamNaarCode[fixture.teams.home.name];
    const uitCode = naamNaarCode[fixture.teams.away.name];
    if (!thuisCode || !uitCode) continue;

    const wedstrijd = wedstrijden.find(
      (w) => w.thuis.code === thuisCode && w.uit.code === uitCode
    );
    if (!wedstrijd) continue;

    const thuis = fixture.score.fulltime.home ?? fixture.goals.home;
    const uit = fixture.score.fulltime.away ?? fixture.goals.away;
    if (thuis === null || uit === null) continue;

    await prisma.resultaat.upsert({
      where: { wedstrijdId: wedstrijd.id },
      update: { thuis, uit },
      create: { wedstrijdId: wedstrijd.id, thuis, uit },
    });
    bijgewerkt++;
  }
  return bijgewerkt;
}

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  try {
    const wkFixtures = await getAfgelopenEnLiveWedstrijden();
    let uitslagen = await syncFixtures(wkFixtures, API_NAAM_NAAR_CODE);

    const uclFixtures = await getAfgelopenEnLiveWedstrijdenVoorLeague(UCL_LEAGUE_ID, UCL_SEASON);
    uitslagen += await syncFixtures(uclFixtures, UCL_NAAM_NAAR_CODE);

    const eersteDoelpunt = await syncEersteDoelpuntenmakers();

    return NextResponse.json({ success: true, uitslagen, eersteDoelpunt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
