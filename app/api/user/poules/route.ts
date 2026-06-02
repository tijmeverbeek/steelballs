import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const deelnemers = await prisma.deelnemer.findMany({
    where: { userId: authUser.id },
    include: {
      poule: true,
      voorspellingen: true,
    },
    orderBy: { poule: { aangemaaktOp: "desc" } },
  });

  const poules = deelnemers.map((d) => ({
    ...d.poule,
    deelnemerId: d.id,
    ingevuld: d.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length,
    featured: d.poule.featured,
  }));

  return NextResponse.json(poules);
}
