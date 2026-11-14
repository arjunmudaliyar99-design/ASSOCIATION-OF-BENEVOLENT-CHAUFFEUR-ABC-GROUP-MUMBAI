import { NextResponse } from "next/server";
import { audit, currentAdmin } from "@/lib/auth";
import { memberCode, one } from "@/lib/db";

/** Shows one member document to a signed-in admin. Never cached, never indexed. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const d = await one<{ mime: string; data: ArrayBuffer; kind: string; member_id: number | null }>("SELECT mime, data, kind, member_id FROM documents WHERE id = ?", [id]);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(admin, "viewed document", `${d.kind} ${d.member_id ? memberCode(d.member_id) : ""}`);
  return new NextResponse(new Uint8Array(d.data), {
    headers: {
      "Content-Type": d.mime,
      "Content-Disposition": `inline; filename="${d.kind}-${id}.${d.mime === "application/pdf" ? "pdf" : d.mime.split("/")[1]}"`,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
