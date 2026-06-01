import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const flags = await prisma.featureFlag.findMany({
    orderBy: { naam: "asc" },
  });

  return NextResponse.json(flags);
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const { naam, aanGezet } = await req.json();
  if (!naam || typeof aanGezet !== "boolean") {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.upsert({
    where: { naam },
    update: { aanGezet },
    create: { naam, aanGezet, beschrijving: "" },
  });

  return NextResponse.json(flag);
}
