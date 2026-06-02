import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

function isGeautoriseerd(req: Request): boolean {
  // Vercel cron stuurt automatisch: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Handmatige trigger via x-sync-secret header
  const syncSecret = req.headers.get("x-sync-secret");
  if (syncSecret && syncSecret === process.env.SYNC_SECRET) return true;
  return false;
}

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

async function sync() {
  let bijgewerkt = 0;

  // WK uitslagen
  const wkFixtures = await getAfgelopenEnLiveWedstrijden();
  bijgewerkt += await syncFixtures(wkFixtures, API_NAAM_NAAR_CODE);

  // UCL (CL Finale)
  const uclFixtures = await getAfgelopenEnLiveWedstrijdenVoorLeague(UCL_LEAGUE_ID, UCL_SEASON);
  bijgewerkt += await syncFixtures(uclFixtures, UCL_NAAM_NAAR_CODE);

  // Eerste doelpuntenmaker + minuut (no-op when already set or match not finished)
  try {
    await syncEersteDoelpuntenmakers();
  } catch {
    // don't fail the main sync if events sync fails
  }

  return bijgewerkt;
}

// GET: aangeroepen door Vercel cron
export async function GET(req: Request) {
  if (!isGeautoriseerd(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const bijgewerkt = await sync();
    return NextResponse.json({ success: true, bijgewerkt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: handmatige trigger
export async function POST(req: Request) {
  if (!isGeautoriseerd(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const bijgewerkt = await sync();
    return NextResponse.json({ success: true, bijgewerkt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
