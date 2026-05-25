import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code } = await params;
  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  if (poule.organisatorId !== authUser.id) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { wedstrijdId, thuis, uit } = await req.json();
  if (!wedstrijdId || thuis === undefined || uit === undefined) {
    return NextResponse.json({ error: "wedstrijdId, thuis en uit zijn verplicht" }, { status: 400 });
  }

  await prisma.resultaat.upsert({
    where: { wedstrijdId },
    update: { thuis, uit },
    create: { wedstrijdId, thuis, uit },
  });

  return NextResponse.json({ success: true });
}
