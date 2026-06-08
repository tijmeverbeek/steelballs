import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const row = await prisma.specialVoorspelling.findUnique({
    where: { userId: user.id },
    select: { antwoorden: true },
  });

  return NextResponse.json((row?.antwoorden as Record<string, string>) ?? {});
}

// 11 juni 2026 21:00 Amsterdam (UTC+2 zomertijd) = 19:00 UTC
const SLUITINGSTIJD = new Date("2026-06-11T19:00:00Z");

export function specialsGesloten(): boolean {
  return new Date() >= SLUITINGSTIJD;
}

export async function POST(req: Request) {
  if (specialsGesloten()) {
    return NextResponse.json({ error: "Specials zijn gesloten" }, { status: 403 });
  }

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body: Record<string, string> = await req.json();

  const geldigeKeys = new Set(SPECIALS_CATEGORIEEN.map((c) => c.key));
  const antwoorden: Record<string, string> = {};
  for (const [key, val] of Object.entries(body)) {
    if (geldigeKeys.has(key) && typeof val === "string") {
      antwoorden[key] = val;
    }
  }

  await prisma.specialVoorspelling.upsert({
    where: { userId: user.id },
    update: { antwoorden },
    create: { userId: user.id, antwoorden },
  });

  return NextResponse.json({ success: true });
}
