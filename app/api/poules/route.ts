import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { naam, soort, wkWedstrijdId } = await req.json();
  if (!naam) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

  let code = generateCode();
  while (await prisma.poule.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const geldigeSoort = ["cl_finale", "lms", "oefenwedstrijd", "enkelvoudig"].includes(soort) ? soort : "wk";
  const isOefenwedstrijd = geldigeSoort === "oefenwedstrijd";

  if (isOefenwedstrijd) {
    await prisma.poule.updateMany({ where: { featured: true }, data: { featured: false } });
  }

  const poule = await prisma.poule.create({
    data: {
      naam,
      code,
      soort: geldigeSoort,
      featured: isOefenwedstrijd,
      organisatorId: authUser.id,
      ...(geldigeSoort === "enkelvoudig" && wkWedstrijdId ? { wkWedstrijdId } : {}),
      deelnemers: {
        create: { userId: authUser.id },
      },
    },
    include: { deelnemers: true },
  });

  return NextResponse.json({ code: poule.code, deelnemerId: poule.deelnemers[0].id });
}
