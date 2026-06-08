import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const user = await getAuthUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isAdmin: true } });
  return dbUser?.isAdmin ? user : null;
}

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const keys = SPECIALS_CATEGORIEEN.map((c) => `special_${c.key}`);
  const rows = await prisma.tournamentStat.findMany({ where: { type: { in: keys } } });

  const resultaten: Record<string, string> = {};
  for (const row of rows) {
    const key = row.type.replace("special_", "");
    resultaten[key] = row.waarde;
  }
  return NextResponse.json(resultaten);
}

export async function POST(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const body: Record<string, string> = await req.json();
  const geldigeKeys = new Set(SPECIALS_CATEGORIEEN.map((c) => c.key));

  for (const [key, waarde] of Object.entries(body)) {
    if (!geldigeKeys.has(key) || typeof waarde !== "string") continue;
    await prisma.tournamentStat.upsert({
      where: { type: `special_${key}` },
      update: { waarde },
      create: { type: `special_${key}`, waarde },
    });
  }

  return NextResponse.json({ success: true });
}
