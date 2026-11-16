import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

/**
 * Tiny check for the uptime monitor (every 5 min) and for the Donate form,
 * which calls it when a visitor starts typing. It wakes the server and the database.
 * The Server-Timing header shows where time goes: schema check vs the query itself.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = performance.now();
  try {
    await ensureSchema();
    const t1 = performance.now();
    await db().execute("SELECT 1 AS ok");
    const t2 = performance.now();
    return NextResponse.json({ ok: true }, {
      headers: { "Cache-Control": "no-store", "Server-Timing": `schema;dur=${(t1 - t0).toFixed(0)}, query;dur=${(t2 - t1).toFixed(0)}` },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
