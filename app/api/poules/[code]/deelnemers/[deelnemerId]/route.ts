import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { isOrganisatorOrAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string; deelnemerId: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code, deelnemerId } = await params;

  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  if (!await isOrganisatorOrAdmin(authUser.id, poule)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const deelnemer = await prisma.deelnemer.findUnique({ where: { id: deelnemerId } });
  if (!deelnemer || deelnemer.pouleId !== poule.id) {
    return NextResponse.json({ error: "Deelnemer niet gevonden" }, { status: 404 });
  }

  const body = await req.json();
  if (typeof body.betaald !== "boolean") {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const updated = await prisma.deelnemer.update({
    where: { id: deelnemerId },
    data: { betaald: body.betaald },
  });

  return NextResponse.json({ success: true, betaald: updated.betaald });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string; deelnemerId: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { code, deelnemerId } = await params;

  const poule = await prisma.poule.findUnique({ where: { code } });
  if (!poule) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  if (!await isOrganisatorOrAdmin(authUser.id, poule)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const deelnemer = await prisma.deelnemer.findUnique({ where: { id: deelnemerId } });
  if (!deelnemer || deelnemer.pouleId !== poule.id) {
    return NextResponse.json({ error: "Deelnemer niet gevonden" }, { status: 404 });
  }

  await prisma.deelnemer.delete({ where: { id: deelnemerId } });

  return NextResponse.json({ success: true });
}
