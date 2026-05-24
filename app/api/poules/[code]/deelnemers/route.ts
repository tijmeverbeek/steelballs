import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { naam } = await req.json();

  if (!naam) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule) return NextResponse.json({ error: "Poule niet gevonden" }, { status: 404 });

  const deelnemer = await prisma.deelnemer.create({
    data: { naam, pouleId: poule.id },
  });

  return NextResponse.json({ deelnemerId: deelnemer.id });
}
