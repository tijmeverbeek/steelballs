import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultaat = await prisma.resultaat.findUnique({ where: { wedstrijdId: id } });
  return NextResponse.json({ resultaat: resultaat ?? null });
}
