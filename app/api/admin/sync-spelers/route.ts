import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import {
  getTeamsVoorLeague,
  getSpelersVoorTeam,
  WK_LEAGUE_ID,
  WK_SEASON,
  API_NAAM_NAAR_CODE,
} from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  try {
    const teams = await getTeamsVoorLeague(WK_LEAGUE_ID, WK_SEASON);
    let opgeslagen = 0;

    for (const team of teams) {
      const teamCode = API_NAAM_NAAR_CODE[team.naam];
      if (!teamCode) continue; // niet een WK-team in onze mapping

      try {
        const spelers = await getSpelersVoorTeam(team.id);
        for (const speler of spelers) {
          await prisma.speler.upsert({
            where: { naam_team_soort: { naam: speler.naam, team: teamCode, soort: "wk" } },
            update: { positie: speler.positie },
            create: { naam: speler.naam, positie: speler.positie, team: teamCode, soort: "wk" },
          });
          opgeslagen++;
        }
      } catch {
        // skip team on API error (rate limit etc.), continue with others
      }
    }

    return NextResponse.json({ success: true, opgeslagen });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
