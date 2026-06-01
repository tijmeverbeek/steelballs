import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({ needsSetup: !dbUser?.gebruikersnaam });
}
