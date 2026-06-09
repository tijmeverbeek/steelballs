import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getHuidigeRonde } from "@/lib/lms";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const deelnemers = await prisma.deelnemer.findMany({
    where: { userId: authUser.id },
    include: {
      poule: true,
      voorspellingen: true,
      lmsPicks: true,
    },
    orderBy: { poule: { aangemaaktOp: "desc" } },
  });

  const huidigeRonde = getHuidigeRonde();

  const poules = deelnemers.map((d) => {
    const isLms = d.poule.soort === "lms";
    const huidigePick = isLms && huidigeRonde
      ? (d.lmsPicks.find((p) => p.rondeNr === huidigeRonde.nr) ?? null)
      : null;

    return {
      ...d.poule,
      deelnemerId: d.id,
      ingevuld: d.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length,
      featured: d.poule.featured,
      lmsActief: isLms ? (d.lmsActief ?? true) : undefined,
      lmsHuidigeRonde: isLms ? (huidigeRonde?.nr ?? null) : undefined,
      lmsHuidigeRondePick: huidigePick
        ? { teamCode: huidigePick.teamCode, uitkomst: huidigePick.uitkomst }
        : null,
    };
  });

  return NextResponse.json(poules);
}
