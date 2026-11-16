import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { one } from "@/lib/db";

/** Shows one blacklist photo or document to a signed-in admin. Never cached, never indexed. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const f = await one<{ mime: string; data: ArrayBuffer; kind: string }>("SELECT mime, data, kind FROM blacklist_files WHERE id = ?", [id]);
  if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `inline; filename="blacklist-${f.kind}-${id}.${f.mime === "application/pdf" ? "pdf" : f.mime.split("/")[1]}"`,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
