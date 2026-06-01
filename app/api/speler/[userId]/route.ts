import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      deelnemers: {
        include: {
          poule: {
            include: { deelnemers: { select: { id: true } } },
          },
        },
        orderBy: { poule: { aangemaaktOp: "desc" } },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  return NextResponse.json({
    gebruikersnaam: user.gebruikersnaam,
    naam: user.naam,
    email: user.email,
    aantalWinsten: user.aantalWinsten,
    aantalPoules: user.deelnemers.length,
    poules: user.deelnemers.map((d) => ({
      naam: d.poule.naam,
      afgerond: d.poule.afgerond,
      gewonnen: d.poule.winnaarId === user.id,
      aantalDeelnemers: d.poule.deelnemers.length,
      aangemaaktOp: d.poule.aangemaaktOp,
    })),
  });
}
