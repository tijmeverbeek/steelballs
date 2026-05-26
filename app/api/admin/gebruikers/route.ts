import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const gebruikers = await prisma.user.findMany({
    orderBy: { aangemaaktOp: "desc" },
    select: {
      id: true,
      email: true,
      gebruikersnaam: true,
      isAdmin: true,
      aangemaaktOp: true,
      aantalWinsten: true,
      _count: { select: { deelnemers: true } },
    },
  });

  return NextResponse.json(gebruikers);
}
