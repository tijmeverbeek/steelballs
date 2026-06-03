import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { getSpelers } from "@/lib/players";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  try {
    const spelers = getSpelers("oefenwedstrijd");
    let opgeslagen = 0;

    for (const speler of spelers) {
      await prisma.speler.upsert({
        where: { naam_team_soort: { naam: speler.naam, team: speler.team, soort: "oefenwedstrijd" } },
        update: { positie: speler.positie },
        create: { naam: speler.naam, positie: speler.positie, team: speler.team, soort: "oefenwedstrijd" },
      });
      opgeslagen++;
    }

    return NextResponse.json({ success: true, opgeslagen });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
