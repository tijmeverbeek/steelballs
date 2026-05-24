import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  const { naam, deelnemerNaam } = await req.json();
  if (!naam || !deelnemerNaam) {
    return NextResponse.json({ error: "Naam en deelnemerNaam zijn verplicht" }, { status: 400 });
  }

  let code = generateCode();
  // Zorg voor unieke code
  while (await prisma.poule.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const poule = await prisma.poule.create({
    data: {
      naam,
      code,
      deelnemers: {
        create: { naam: deelnemerNaam },
      },
    },
    include: { deelnemers: true },
  });

  return NextResponse.json({ code: poule.code, deelnemerId: poule.deelnemers[0].id });
}
