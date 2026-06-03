import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { findOefFixture, syncOefenwedstrijdCorners } from "@/lib/sync-events";
import { getFixtureEvents } from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  try {
    const fixture = await findOefFixture();
    if (!fixture) {
      return NextResponse.json({ success: false, error: "Fixture niet gevonden in api-football (friendlies league 10, 2026-06-03)" });
    }

    const cornersResult = await syncOefenwedstrijdCorners();

    const events = await getFixtureEvents(fixture.fixture.id);
    const eersteGoal = events.find(
      (e) => e.type === "Goal" && e.detail !== "Own Goal" && e.player.name
    );

    return NextResponse.json({
      success: true,
      fixtureId: fixture.fixture.id,
      status: fixture.fixture.status.short,
      corners: cornersResult,
      eersteGoal: eersteGoal
        ? { speler: eersteGoal.player.name, minuut: eersteGoal.time.elapsed }
        : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
