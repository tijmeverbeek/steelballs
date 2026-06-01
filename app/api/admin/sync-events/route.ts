import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { syncEersteDoelpuntenmakers } from "@/lib/sync-events";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 });

  try {
    const bijgewerkt = await syncEersteDoelpuntenmakers();
    return NextResponse.json({ success: true, bijgewerkt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
