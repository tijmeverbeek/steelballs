import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: alle LMS knockout wedstrijden (publiek)
export async function GET() {
  const wedstrijden = await prisma.lmsWedstrijd.findMany({
    orderBy: [{ rondeNr: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ wedstrijden });
}

// POST: voeg een knockout wedstrijd toe (vereist: LMS-organizer of admin)
export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const isAdmin = await prisma.user.findUnique({ where: { id: authUser.id }, select: { isAdmin: true } });
  const isLmsOrg = isAdmin?.isAdmin ? true : !!(await prisma.poule.findFirst({
    where: { soort: "lms", organisatorId: authUser.id },
  }));

  if (!isLmsOrg) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const { rondeNr, thuisCode, thuisNaam, thuisVlag, uitCode, uitNaam, uitVlag, datum, tijd } = await req.json();

  if (!rondeNr || !thuisCode || !thuisNaam || !uitCode || !uitNaam) {
    return NextResponse.json({ error: "Verplichte velden ontbreken" }, { status: 400 });
  }
  if (thuisCode === uitCode) {
    return NextResponse.json({ error: "Thuis- en uitteam mogen niet hetzelfde zijn" }, { status: 400 });
  }

  const wedstrijd = await prisma.lmsWedstrijd.create({
    data: { rondeNr, thuisCode, thuisNaam, thuisVlag: thuisVlag ?? "", uitCode, uitNaam, uitVlag: uitVlag ?? "", datum: datum || null, tijd: tijd || null },
  });

  return NextResponse.json({ wedstrijd });
}
