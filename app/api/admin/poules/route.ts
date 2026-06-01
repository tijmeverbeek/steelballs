import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const poules = await prisma.poule.findMany({
    orderBy: { aangemaaktOp: "desc" },
    select: {
      id: true,
      naam: true,
      code: true,
      soort: true,
      aangemaaktOp: true,
      afgerond: true,
      organisatorId: true,
      _count: { select: { deelnemers: true } },
    },
  });

  // Fetch organisator emails in bulk
  const orgIds = poules
    .map((p) => p.organisatorId)
    .filter((id): id is string => id !== null);

  const organisatoren = orgIds.length
    ? await prisma.user.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, email: true },
      })
    : [];

  const orgMap: Record<string, string> = {};
  for (const o of organisatoren) {
    orgMap[o.id] = o.email;
  }

  const result = poules.map((p) => ({
    ...p,
    organisatorEmail: p.organisatorId ? (orgMap[p.organisatorId] ?? null) : null,
  }));

  return NextResponse.json(result);
}
