import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const poule = await prisma.poule.findFirst({
    where: { featured: true },
    select: { code: true, naam: true },
  });
  if (!poule) return NextResponse.json(null);
  return NextResponse.json(poule);
}
