import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { getNLVolgendeWedstrijd } from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  try {
    const info = await getNLVolgendeWedstrijd();
    if (!info) return NextResponse.json({ error: "Geen aankomende NL wedstrijd gevonden in API" }, { status: 404 });

    await prisma.tournamentStat.upsert({
      where: { type: "nl_wedstrijd" },
      update: { waarde: JSON.stringify(info) },
      create: { type: "nl_wedstrijd", waarde: JSON.stringify(info) },
    });

    return NextResponse.json({ success: true, wedstrijd: info });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
