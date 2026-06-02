import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const clFinale = await prisma.poule.findUnique({ where: { code: "SGPZ3B" } });
  if (!clFinale || clFinale.organisatorId !== authUser.id) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const bestaande = await prisma.poule.findFirst({ where: { featured: true } });
  if (bestaande) {
    return NextResponse.json({ code: bestaande.code, bestaand: true });
  }

  let code = "UITZWAAI";
  const codeExists = await prisma.poule.findUnique({ where: { code } });
  if (codeExists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const poule = await prisma.poule.create({
    data: {
      naam: "Nederland - Algerije · Uitzwaai",
      code,
      organisatorId: authUser.id,
      featured: true,
      deelnemers: {
        create: { userId: authUser.id },
      },
    },
  });

  return NextResponse.json({ code: poule.code, bestaand: false });
}
