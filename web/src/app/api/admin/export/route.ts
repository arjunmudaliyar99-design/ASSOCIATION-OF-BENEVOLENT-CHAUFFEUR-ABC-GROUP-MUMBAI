import { NextResponse } from "next/server";
import { audit, currentAdmin } from "@/lib/auth";
import { memberCode, q, today } from "@/lib/db";
import { donationWhere, memberCols, memberJoin, memberWhere } from "@/lib/adminQueries";
import { xlsx } from "@/lib/xlsx";

// Cells are written as plain text in the .xlsx, so Excel never runs them as formulas.
const sheet = (head: string[], rows: unknown[][]) => ({ head, rows });

export async function GET(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams) as Record<string, string>;
  let body: { head: string[]; rows: unknown[][] }, name: string;

  if (sp.type === "members") {
    const t = today(), w = memberWhere(sp, t);
    const rows = await q<Record<string, string | number>>(`SELECT m.*, p.label AS plan_label FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE ${memberWhere(sp, t, "m.").sql} ORDER BY m.id`, w.args);
    body = sheet(["Member no", "Name", "Mobile", "Email", "Licence", "PAN", "Area", "Plan", "Amount (₹)", "Paid on", "Valid until", "Status", "In WhatsApp group", "Source", "Payment mode", "Notes"],
      rows.map((m) => [memberCode(Number(m.id)), m.name, m.phone, m.email, m.licence_no, m.pan, m.area, m.plan_label, Number(m.amount_paise) / 100, m.paid_on, m.expires_on,
        m.status === "active" && String(m.expires_on) < t ? "expired" : m.status, m.in_group ? "yes" : "no", m.source, m.payment_mode, m.notes]));
    name = "members";
  } else if (sp.type === "blacklist") {
    const rows = await q<Record<string, string | number | null>>("SELECT id, member_id, name, phone, reason, details, added_by, created_at FROM blacklist ORDER BY created_at DESC");
    body = sheet(["ID no", "Name", "Mobile", "Reason", "Details", "Added by", "Added on"],
      rows.map((r) => [r.member_id ? memberCode(Number(r.member_id)) : "", r.name, r.phone, r.reason, r.details, r.added_by, r.created_at]));
    name = "blacklist";
  } else {
    const w = donationWhere(sp, "payments.");
    const rows = await q<Record<string, string | number>>(`SELECT payments.*, ${memberCols()} FROM payments ${memberJoin()} WHERE ${w.sql} ORDER BY payments.created_at`, w.args);
    body = sheet(["Date", "Name", "Email", "Phone", "Cause", "Amount (₹)", "PAN", "Razorpay payment ID", "Order ID", "Status", "ABC member?", "Member no", "Member name", "Member mobile", "Member status", "Valid until"],
      rows.map((r) => [r.paid_at ?? r.created_at, r.name, r.email, r.phone, r.cause, Number(r.amount_paise) / 100, r.pan, r.payment_id, r.order_id, r.status,
        r.m_id ? "Yes" : "No", r.m_id ? memberCode(Number(r.m_id)) : "", r.m_name, r.m_phone,
        r.m_id ? (r.m_status === "active" && String(r.m_expires) < today() ? "expired" : r.m_status) : "", r.m_expires]));
    name = "donations";
  }
  await audit(admin, "export", name);
  return new NextResponse(xlsx(name, body.head, body.rows).buffer as ArrayBuffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="abc-${name}-${today()}.xlsx"`, "Cache-Control": "no-store" },
  });
}
