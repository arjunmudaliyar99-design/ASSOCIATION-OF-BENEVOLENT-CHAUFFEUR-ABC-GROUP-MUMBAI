import { NextResponse } from "next/server";
import { audit, currentAdmin } from "@/lib/auth";
import { memberCode, q, today } from "@/lib/db";
import { donationWhere, memberWhere } from "@/lib/adminQueries";

// Prefix cells that Excel would treat as formulas (CSV injection protection).
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

export async function GET(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams) as Record<string, string>;
  let body: string, name: string;

  if (sp.type === "members") {
    const t = today(), w = memberWhere(sp, t);
    const rows = await q<Record<string, string | number>>(`SELECT m.*, p.label AS plan_label FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE ${memberWhere(sp, t, "m.").sql} ORDER BY m.id`, w.args);
    body = csv(["Member no", "Name", "Mobile", "Email", "Licence", "PAN", "Area", "Plan", "Amount (₹)", "Paid on", "Valid until", "Status", "In WhatsApp group", "Source", "Payment mode", "Notes"],
      rows.map((m) => [memberCode(Number(m.id)), m.name, m.phone, m.email, m.licence_no, m.pan, m.area, m.plan_label, Number(m.amount_paise) / 100, m.paid_on, m.expires_on,
        m.status === "active" && String(m.expires_on) < t ? "expired" : m.status, m.in_group ? "yes" : "no", m.source, m.payment_mode, m.notes]));
    name = "members";
  } else {
    const w = donationWhere(sp);
    const rows = await q<Record<string, string | number>>(`SELECT * FROM payments WHERE ${w.sql} ORDER BY created_at`, w.args);
    body = csv(["Date", "Name", "Email", "Phone", "Cause", "Amount (₹)", "PAN", "Razorpay payment ID", "Order ID", "Status"],
      rows.map((r) => [r.paid_at ?? r.created_at, r.name, r.email, r.phone, r.cause, Number(r.amount_paise) / 100, r.pan, r.payment_id, r.order_id, r.status]));
    name = "donations";
  }
  await audit(admin, "export", name);
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="abc-${name}-${today()}.csv"`, "Cache-Control": "no-store" },
  });
}
