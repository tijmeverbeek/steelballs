import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import {
  getAfgelopenEnLiveWedstrijdenVoorLeague,
  getFixtureEvents,
  UCL_LEAGUE_ID,
  UCL_SEASON,
  UCL_NAAM_NAAR_CODE,
  WK_LEAGUE_ID,
  WK_SEASON,
  API_NAAM_NAAR_CODE,
} from "@/lib/football-api";
import { wedstrijden, getWedstrijdenVoorSoort } from "@/lib/matches";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  const rapport: Record<string, unknown> = {};

  // ── API quota ─────────────────────────────────────────────────────
  try {
    const statusRes = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY! },
    });
    const statusData = await statusRes.json();
    const req = statusData.response?.requests;
    rapport.apiQuota = {
      gebruikt: req?.current,
      limiet: req?.limit_day,
      resterend: (req?.limit_day ?? 0) - (req?.current ?? 0),
    };
  } catch (err) {
    rapport.apiQuota = { fout: String(err) };
  }

  // ── UCL (CL Finale) ───────────────────────────────────────────────
  try {
    const uclFixtures = await getAfgelopenEnLiveWedstrijdenVoorLeague(UCL_LEAGUE_ID, UCL_SEASON);
    rapport.uclFixtures = {
      totaal: uclFixtures.length,
      wedstrijden: uclFixtures.map((f) => ({
        id: f.fixture.id,
        status: f.fixture.status.short,
        thuis: f.teams.home.name,
        uit: f.teams.away.name,
        score: `${f.score.fulltime.home ?? "?"}–${f.score.fulltime.away ?? "?"}`,
        thuisCode: UCL_NAAM_NAAR_CODE[f.teams.home.name] ?? null,
        uitCode: UCL_NAAM_NAAR_CODE[f.teams.away.name] ?? null,
      })),
    };

    // CL Finale specifiek
    const clFinale = uclFixtures.find(
      (f) =>
        (f.teams.home.name.includes("Paris") && f.teams.away.name.includes("Arsenal")) ||
        (f.teams.home.name.includes("Arsenal") && f.teams.away.name.includes("Paris"))
    );

    if (clFinale) {
      const events = await getFixtureEvents(clFinale.fixture.id);
      const goals = events.filter((e) => e.type === "Goal");
      const eersteGoal = goals.find((e) => e.detail !== "Own Goal" && e.player.name);

      const dbResultaat = await prisma.resultaat.findUnique({ where: { wedstrijdId: "CL1" } });
      const dbPoules = await prisma.poule.findMany({
        where: { soort: "cl_finale" },
        select: {
          naam: true,
          afgerond: true,
          eersteDoelpuntenmakerActief: true,
          eersteDoelpuntenmakerResultaat: true,
          eersteDoelpuntenminuutResultaat: true,
        },
      });

      rapport.clFinale = {
        fixtureId: clFinale.fixture.id,
        uitslag: `${clFinale.score.fulltime.home ?? "?"}–${clFinale.score.fulltime.away ?? "?"}`,
        aantalGoals: goals.length,
        eersteGoal: eersteGoal
          ? { speler: eersteGoal.player.name, minuut: eersteGoal.time.elapsed, detail: eersteGoal.detail }
          : null,
        dbUitslag: dbResultaat ? `${dbResultaat.thuis}–${dbResultaat.uit}` : null,
        dryRun: {
          uitslag: `CL1 → ${clFinale.score.fulltime.home}–${clFinale.score.fulltime.away} (${dbResultaat ? "update" : "nieuw"})`,
          eersteDoelpuntenmaker: eersteGoal?.player.name ?? null,
          eersteDoelpuntenminuut: eersteGoal?.time.elapsed ?? null,
        },
        poules: dbPoules,
      };
    } else {
      rapport.clFinale = { gevonden: false };
    }
  } catch (err) {
    rapport.uclFixtures = { fout: String(err) };
  }

  // ── WK ────────────────────────────────────────────────────────────
  try {
    const wkFixtures = await getAfgelopenEnLiveWedstrijdenVoorLeague(WK_LEAGUE_ID, WK_SEASON);
    const wkWedstrijden = getWedstrijdenVoorSoort("wk");
    const eersteWKWedstrijd = wkWedstrijden[0];

    const gemaptFixtures = wkFixtures.map((f) => {
      const t = API_NAAM_NAAR_CODE[f.teams.home.name];
      const u = API_NAAM_NAAR_CODE[f.teams.away.name];
      const w = wedstrijden.find((w) => w.thuis.code === t && w.uit.code === u);
      return {
        thuis: f.teams.home.name,
        uit: f.teams.away.name,
        thuisCode: t ?? null,
        uitCode: u ?? null,
        wedstrijdId: w?.id ?? null,
        score: `${f.score.fulltime.home ?? "?"}–${f.score.fulltime.away ?? "?"}`,
        status: f.fixture.status.short,
      };
    });

    rapport.wk = {
      aantalAfgelopen: wkFixtures.length,
      eersteVerwachteWedstrijd: eersteWKWedstrijd
        ? `${eersteWKWedstrijd.thuis.code} vs ${eersteWKWedstrijd.uit.code} (${eersteWKWedstrijd.datum})`
        : null,
      fixtures: gemaptFixtures,
    };
  } catch (err) {
    rapport.wk = { fout: String(err) };
  }

  return NextResponse.json(rapport, { status: 200 });
}
