import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { naam, soort } = await req.json();
  if (!naam) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

  let code = generateCode();
  while (await prisma.poule.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const poule = await prisma.poule.create({
    data: {
      naam,
      code,
      soort: ["cl_finale", "nl_oefen", "lms"].includes(soort) ? soort : "wk",
      organisatorId: authUser.id,
      deelnemers: {
        create: { userId: authUser.id },
      },
    },
    include: { deelnemers: true },
  });

  return NextResponse.json({ code: poule.code, deelnemerId: poule.deelnemers[0].id });
}
