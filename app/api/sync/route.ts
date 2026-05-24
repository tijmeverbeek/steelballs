import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAfgelopenEnLiveWedstrijden, API_NAAM_NAAR_CODE } from "@/lib/football-api";
import { wedstrijden } from "@/lib/matches";

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

async function sync() {
  const fixtures = await getAfgelopenEnLiveWedstrijden();
  let bijgewerkt = 0;

  for (const fixture of fixtures) {
    const thuisCode = API_NAAM_NAAR_CODE[fixture.teams.home.name];
    const uitCode = API_NAAM_NAAR_CODE[fixture.teams.away.name];
    if (!thuisCode || !uitCode) continue;

    const wedstrijd = wedstrijden.find(
      (w) => w.thuis.code === thuisCode && w.uit.code === uitCode
    );
    if (!wedstrijd) continue;

    // Live: gebruik goals; afgelopen: gebruik fulltime score
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
