import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await request.json();
  const { gebruikersnaam, naam } = body as { gebruikersnaam?: string; naam?: string };

  const updateData: Record<string, string> = {};

  if (gebruikersnaam !== undefined) {
    if (!gebruikersnaam?.trim()) {
      return NextResponse.json({ error: "Gebruikersnaam is verplicht" }, { status: 400 });
    }
    const cleaned = gebruikersnaam.trim();
    if (cleaned.length < 2 || cleaned.length > 30) {
      return NextResponse.json({ error: "Gebruikersnaam moet 2–30 tekens zijn" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(cleaned)) {
      return NextResponse.json({ error: "Alleen letters, cijfers, spaties, - en _" }, { status: 400 });
    }
    updateData.gebruikersnaam = cleaned;
  }

  if (naam !== undefined) {
    const cleanedNaam = naam.trim();
    if (cleanedNaam.length < 1 || cleanedNaam.length > 50) {
      return NextResponse.json({ error: "Naam moet 1–50 tekens zijn" }, { status: 400 });
    }
    updateData.naam = cleanedNaam;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Geen velden opgegeven" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Deze gebruikersnaam is al bezet" }, { status: 409 });
    }
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
