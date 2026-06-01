import { NextResponse } from "next/server";
import { syncEersteDoelpuntenmakers } from "@/lib/sync-events";

export const dynamic = "force-dynamic";

function isGeautoriseerd(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const syncSecret = req.headers.get("x-sync-secret");
  if (syncSecret && syncSecret === process.env.SYNC_SECRET) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isGeautoriseerd(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const bijgewerkt = await syncEersteDoelpuntenmakers();
    return NextResponse.json({ success: true, bijgewerkt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isGeautoriseerd(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const bijgewerkt = await syncEersteDoelpuntenmakers();
    return NextResponse.json({ success: true, bijgewerkt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
