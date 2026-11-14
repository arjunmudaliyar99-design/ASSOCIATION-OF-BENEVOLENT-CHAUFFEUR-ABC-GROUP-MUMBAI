import { NextResponse } from "next/server";
import { one } from "@/lib/db";

/**
 * Tiny check for the uptime monitor (every 5 min) and for the Donate/Join forms,
 * which call it when a visitor starts typing. It wakes the server and the database,
 * so the Pay button responds without a cold-start wait.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await one("SELECT 1 AS ok");
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
