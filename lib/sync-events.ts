import { prisma } from "./db";
import {
  UCL_LEAGUE_ID,
  UCL_SEASON,
  WK_LEAGUE_ID,
  WK_SEASON,
  FRIENDLIES_LEAGUE_ID,
  API_NAAM_NAAR_CODE,
  getAfgelopenEnLiveWedstrijdenVoorLeague,
  getFixtureEvents,
  getFixtureStatistics,
  getFixturesByLeagueAndDate,
} from "./football-api";
import { getWedstrijdenVoorSoort } from "./matches";

export async function syncEersteDoelpuntenmakers(): Promise<number> {
  let bijgewerkt = 0;

  // ── CL Finale ─────────────────────────────────────────────────────
  const clPoules = await prisma.poule.findMany({
    where: {
      soort: "cl_finale",
      eersteDoelpuntenmakerActief: true,
      eersteDoelpuntenmakerResultaat: null,
    },
  });

  if (clPoules.length > 0) {
    const clFixtures = await getAfgelopenEnLiveWedstrijdenVoorLeague(UCL_LEAGUE_ID, UCL_SEASON);
    const clFinale = clFixtures.find(
      (f) =>
        (f.teams.home.name.includes("Paris") && f.teams.away.name.includes("Arsenal")) ||
        (f.teams.home.name.includes("Arsenal") && f.teams.away.name.includes("Paris"))
    );
    if (clFinale) {
      const events = await getFixtureEvents(clFinale.fixture.id);
      const eersteGoal = events.find(
        (e) => e.type === "Goal" && e.detail !== "Own Goal" && e.player.name
      );
      if (eersteGoal?.player.name) {
        await prisma.poule.updateMany({
          where: { soort: "cl_finale", eersteDoelpuntenmakerActief: true },
          data: {
            eersteDoelpuntenmakerResultaat: eersteGoal.player.name,
            eersteDoelpuntenminuutResultaat: eersteGoal.time.elapsed,
          },
        });
        bijgewerkt += clPoules.length;
      }
    }
  }

  // ── WK ────────────────────────────────────────────────────────────
  const wkPoules = await prisma.poule.findMany({
    where: {
      soort: "wk",
      eersteDoelpuntenmakerActief: true,
      eersteDoelpuntenmakerResultaat: null,
    },
  });

  if (wkPoules.length > 0) {
    // First goal = first goal scored in the earliest WK match
    const wkWedstrijden = getWedstrijdenVoorSoort("wk"); // sorted by date
    const eersteWKWedstrijd = wkWedstrijden[0];
    if (eersteWKWedstrijd) {
      const wkFixtures = await getAfgelopenEnLiveWedstrijdenVoorLeague(WK_LEAGUE_ID, WK_SEASON);
      const fixture = wkFixtures.find((f) => {
        const t = API_NAAM_NAAR_CODE[f.teams.home.name];
        const u = API_NAAM_NAAR_CODE[f.teams.away.name];
        return t === eersteWKWedstrijd.thuis.code && u === eersteWKWedstrijd.uit.code;
      });
      if (fixture) {
        const events = await getFixtureEvents(fixture.fixture.id);
        const eersteGoal = events.find(
          (e) => e.type === "Goal" && e.detail !== "Own Goal" && e.player.name
        );
        if (eersteGoal?.player.name) {
          await prisma.poule.updateMany({
            where: { soort: "wk", eersteDoelpuntenmakerActief: true },
            data: {
              eersteDoelpuntenmakerResultaat: eersteGoal.player.name,
              eersteDoelpuntenminuutResultaat: eersteGoal.time.elapsed,
            },
          });
          bijgewerkt += wkPoules.length;
        }
      }
    }
  }

  // ── Oefenwedstrijd NED vs ALG ─────────────────────────────────────
  const oefPoules = await prisma.poule.findMany({
    where: {
      soort: "oefenwedstrijd",
      eersteDoelpuntenmakerActief: true,
      eersteDoelpuntenmakerResultaat: null,
    },
  });

  if (oefPoules.length > 0) {
    const fixture = await findOefFixture();
    if (fixture) {
      const events = await getFixtureEvents(fixture.fixture.id);
      const eersteGoal = events.find(
        (e) => e.type === "Goal" && e.detail !== "Own Goal" && e.player.name
      );
      if (eersteGoal?.player.name) {
        await prisma.poule.updateMany({
          where: { soort: "oefenwedstrijd", eersteDoelpuntenmakerActief: true },
          data: {
            eersteDoelpuntenmakerResultaat: eersteGoal.player.name,
            eersteDoelpuntenminuutResultaat: eersteGoal.time.elapsed,
          },
        });
        bijgewerkt += oefPoules.length;
      }
    }
  }

  return bijgewerkt;
}

// Zoek de NED vs ALG fixture in friendlies op 3 juni 2026
export async function findOefFixture() {
  const fixtures = await getFixturesByLeagueAndDate(FRIENDLIES_LEAGUE_ID, 2026, "2026-06-03");
  return fixtures.find(
    (f) =>
      (f.teams.home.name.includes("Netherlands") && f.teams.away.name.includes("Algeria")) ||
      (f.teams.home.name.includes("Algeria") && f.teams.away.name.includes("Netherlands"))
  ) ?? null;
}

// Haalt corners op voor NED vs ALG en slaat op als Resultaat voor OEF1
export async function syncOefenwedstrijdCorners(): Promise<{ thuis: number | null; uit: number | null; opgeslagen: boolean }> {
  const fixture = await findOefFixture();
  if (!fixture) return { thuis: null, uit: null, opgeslagen: false };

  const stats = await getFixtureStatistics(fixture.fixture.id);

  function getCornersVoorTeam(naam: string): number | null {
    const team = stats.find((s) => s.team.name.includes(naam));
    if (!team) return null;
    const cornerStat = team.statistics.find((s) => s.type === "Corner Kicks");
    if (cornerStat == null) return null;
    return typeof cornerStat.value === "number" ? cornerStat.value : parseInt(String(cornerStat.value ?? ""), 10) || null;
  }

  // Bepaal thuis/uit volgorde (NED is thuis in onze matches.ts)
  const nedIsThuis = fixture.teams.home.name.includes("Netherlands");
  const thuisCorners = getCornersVoorTeam(nedIsThuis ? "Netherlands" : "Algeria");
  const uitCorners = getCornersVoorTeam(nedIsThuis ? "Algeria" : "Netherlands");

  if (thuisCorners === null || uitCorners === null) {
    return { thuis: thuisCorners, uit: uitCorners, opgeslagen: false };
  }

  await prisma.resultaat.upsert({
    where: { wedstrijdId: "OEF1" },
    update: { thuis: thuisCorners, uit: uitCorners },
    create: { wedstrijdId: "OEF1", thuis: thuisCorners, uit: uitCorners },
  });

  return { thuis: thuisCorners, uit: uitCorners, opgeslagen: true };
}
