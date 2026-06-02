import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const [gebruikers, poules, actievePoules, voorspellingen, pouleSoortGroep] =
    await Promise.all([
      prisma.user.count(),
      prisma.poule.count(),
      prisma.poule.count({ where: { afgerond: false } }),
      prisma.voorspelling.count(),
      prisma.poule.groupBy({
        by: ["soort"],
        _count: { soort: true },
      }),
    ]);

  const poulesSoort: Record<string, number> = { wk: 0, cl_finale: 0, nl_oefen: 0, lms: 0 };
  for (const row of pouleSoortGroep) {
    poulesSoort[row.soort] = row._count.soort;
  }

  return NextResponse.json({
    gebruikers,
    poules,
    poulesSoort: {
      wk: poulesSoort.wk ?? 0,
      cl_finale: poulesSoort.cl_finale ?? 0,
      nl_oefen: poulesSoort.nl_oefen ?? 0,
      lms: poulesSoort.lms ?? 0,
    },
    actievePoules,
    voorspellingen,
  });
}
