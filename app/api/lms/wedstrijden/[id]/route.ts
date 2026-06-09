import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const isAdmin = await prisma.user.findUnique({ where: { id: authUser.id }, select: { isAdmin: true } });
  const isLmsOrg = isAdmin?.isAdmin ? true : !!(await prisma.poule.findFirst({
    where: { soort: "lms", organisatorId: authUser.id },
  }));

  if (!isLmsOrg) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const { id } = await params;
  await prisma.lmsWedstrijd.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
