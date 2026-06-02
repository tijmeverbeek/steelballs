import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NL_OEFENWEDSTRIJD } from "@/lib/matches";
import { NL_TEAM_ID } from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [poule, stat] = await Promise.all([
      prisma.poule.findFirst({
        where: { soort: "nl_oefen", afgerond: false },
        select: { code: true },
      }),
      prisma.tournamentStat.findUnique({ where: { type: "nl_wedstrijd" } }),
    ]);

    let wedstrijd = null;
    if (stat) {
      try {
        const info = JSON.parse(stat.waarde);
        const nlIsThuis = info.thuisId === NL_TEAM_ID;
        wedstrijd = {
          ...NL_OEFENWEDSTRIJD,
          thuis: nlIsThuis
            ? { code: "NED", naam: "Nederland", vlag: "🇳🇱" }
            : { code: "OPP", naam: info.thuisNaam ?? "Tegenstander", vlag: "" },
          uit: nlIsThuis
            ? { code: "OPP", naam: info.uitNaam ?? "Tegenstander", vlag: "" }
            : { code: "NED", naam: "Nederland", vlag: "🇳🇱" },
          datum: info.datum ?? NL_OEFENWEDSTRIJD.datum,
          tijd: info.tijd ?? NL_OEFENWEDSTRIJD.tijd,
        };
      } catch { /* keep null */ }
    }

    return NextResponse.json({ wedstrijd, pouleCode: poule?.code ?? null });
  } catch {
    return NextResponse.json({ wedstrijd: null, pouleCode: null });
  }
}
