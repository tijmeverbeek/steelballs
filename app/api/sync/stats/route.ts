import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTopscorers, getTopGeleKaarten } from "@/lib/football-api";

function isGeautoriseerd(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const syncSecret = req.headers.get("x-sync-secret");
  if (syncSecret && syncSecret === process.env.SYNC_SECRET) return true;
  return false;
}

async function syncStats() {
  const resultaat: Record<string, string> = {};

  const topscorers = await getTopscorers();
  if (topscorers.length > 0) {
    const naam = topscorers[0].player.name;
    await prisma.tournamentStat.upsert({
      where: { type: "topscorer" },
      update: { waarde: naam },
      create: { type: "topscorer", waarde: naam },
    });
    resultaat.topscorer = naam;
  }

  const geleKaarten = await getTopGeleKaarten();
  if (geleKaarten.length > 0) {
    const naam = geleKaarten[0].player.name;
    await prisma.tournamentStat.upsert({
      where: { type: "geleKaarten" },
      update: { waarde: naam },
      create: { type: "geleKaarten", waarde: naam },
    });
    resultaat.geleKaarten = naam;
  }

  return resultaat;
}

export async function GET(req: Request) {
  if (!isGeautoriseerd(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const resultaat = await syncStats();
    return NextResponse.json({ success: true, ...resultaat });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isGeautoriseerd(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const resultaat = await syncStats();
    return NextResponse.json({ success: true, ...resultaat });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
