import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "Je kunt je eigen admin-rechten niet wijzigen" },
      { status: 400 }
    );
  }

  const { isAdmin } = await req.json();
  if (typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isAdmin },
    select: {
      id: true,
      email: true,
      gebruikersnaam: true,
      isAdmin: true,
      aangemaaktOp: true,
      aantalWinsten: true,
    },
  });

  return NextResponse.json(updated);
}
