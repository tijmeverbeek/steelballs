import { prisma } from "./db";
import {
  UCL_LEAGUE_ID,
  UCL_SEASON,
  WK_LEAGUE_ID,
  WK_SEASON,
  API_NAAM_NAAR_CODE,
  getAfgelopenEnLiveWedstrijdenVoorLeague,
  getFixtureEvents,
  NL_TEAM_ID,
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

  // ── NL Oefenwedstrijd ─────────────────────────────────────────────
  const nlPoules = await prisma.poule.findMany({
    where: {
      soort: "nl_oefen",
      eersteDoelpuntenmakerActief: true,
      eersteDoelpuntenmakerResultaat: null,
    },
  });

  if (nlPoules.length > 0) {
    const nlStat = await prisma.tournamentStat.findUnique({ where: { type: "nl_wedstrijd" } });
    if (nlStat) {
      try {
        const info = JSON.parse(nlStat.waarde);
        if (info.fixtureId) {
          const events = await getFixtureEvents(info.fixtureId);
          const eersteGoal = events.find(
            (e) => e.type === "Goal" && e.detail !== "Own Goal" && e.player.name
          );
          if (eersteGoal?.player.name) {
            await prisma.poule.updateMany({
              where: { soort: "nl_oefen", eersteDoelpuntenmakerActief: true },
              data: {
                eersteDoelpuntenmakerResultaat: eersteGoal.player.name,
                eersteDoelpuntenminuutResultaat: eersteGoal.time.elapsed,
              },
            });
            bijgewerkt += nlPoules.length;
          }
        }
      } catch { /* ignore parse errors */ }
    }
  }

  return bijgewerkt;
}
