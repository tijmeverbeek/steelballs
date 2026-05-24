import { NextResponse } from "next/server";
import { WK_LEAGUE_ID, WK_SEASON } from "@/lib/football-api";

export const dynamic = "force-dynamic";

function isGeautoriseerd(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const syncSecret = req.headers.get("x-sync-secret");
  if (syncSecret && syncSecret === process.env.SYNC_SECRET) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isGeautoriseerd(req)) {
    return NextResponse.json({ error: "Unauthorized — stuur x-sync-secret header mee" }, { status: 401 });
  }

  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "FOOTBALL_API_KEY niet ingesteld" }, { status: 500 });
  }

  const headers = { "x-apisports-key": key };

  // 1. Check API-sleutel via /status
  const statusRes = await fetch("https://v3.football.api-sports.io/status", { headers });
  if (!statusRes.ok) {
    return NextResponse.json({
      ok: false,
      stap: "API-sleutel check",
      fout: `HTTP ${statusRes.status}`,
    }, { status: 502 });
  }
  const statusData = await statusRes.json();
  const account = statusData.response?.account;
  const requests = statusData.response?.requests;

  // 2. Haal WK-fixtures op
  const fixturesRes = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${WK_LEAGUE_ID}&season=${WK_SEASON}`,
    { headers }
  );
  const fixturesData = fixturesRes.ok ? await fixturesRes.json() : null;
  const aantalFixtures = fixturesData?.results ?? 0;

  return NextResponse.json({
    ok: true,
    account: {
      naam: account?.firstname + " " + account?.lastname,
      plan: account?.plan,
    },
    apiCalls: {
      gebruikt: requests?.current,
      limiet: requests?.limit_day,
      resterend: (requests?.limit_day ?? 0) - (requests?.current ?? 0),
    },
    wk2026: {
      leagueId: WK_LEAGUE_ID,
      seizoen: WK_SEASON,
      aantalWedstrijden: aantalFixtures,
    },
  });
}
