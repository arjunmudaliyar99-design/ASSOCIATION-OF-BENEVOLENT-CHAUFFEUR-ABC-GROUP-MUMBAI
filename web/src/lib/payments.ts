import "server-only";
import crypto from "node:crypto";
import { addMonths, ensureSchema, one, run, today } from "@/lib/db";

export type MemberMeta = { name: string; phone: string; email?: string; licence_no?: string; pan?: string; area?: string; renew_of?: number };

/**
 * Marks an order paid exactly once (safe to call from both the browser verify step and the webhook).
 * The single conditional UPDATE is the lock: only the first caller changes the row, so a payment can
 * never be recorded twice, even without a transaction (Cloudflare D1 has none).
 * For memberships (older online orders), creates or extends the member. Returns the member id if any.
 */
export async function markPaid(orderId: string, paymentId: string): Promise<{ kind: string; memberId?: number; token?: string } | null> {
  await ensureSchema();
  const claim = await run("UPDATE payments SET status = 'paid', payment_id = ?, paid_at = datetime('now') WHERE order_id = ? AND status != 'paid'", [paymentId, orderId]);
  const p = await one<{ kind: string; plan_id: string | null; member_id: number | null; amount_paise: number; meta: string | null }>("SELECT * FROM payments WHERE order_id = ?", [orderId]);
  if (!p) return null;
  if (!claim.rowsAffected) {
    // Already recorded earlier (duplicate webhook or second browser call).
    if (!p.member_id) return { kind: p.kind };
    const m = await one<{ token: string }>("SELECT token FROM members WHERE id = ?", [p.member_id]);
    return { kind: p.kind, memberId: Number(p.member_id), token: m?.token };
  }

  let memberId: number | undefined, token: string | undefined;
  if (p.kind === "membership") {
    const meta = JSON.parse(p.meta ?? "{}") as MemberMeta;
    const plan = await one<{ months: number }>("SELECT months FROM plans WHERE id = ?", [p.plan_id]);
    const existing = await one<{ id: number; token: string; status: string; expires_on: string | null }>("SELECT id, token, status, expires_on FROM members WHERE phone = ?", [meta.phone]);
    const t = today(), months = Number(plan?.months ?? 12);
    if (existing) {
      // Renewal: extend from the later of today or the current expiry.
      const start = existing.expires_on && existing.expires_on >= t ? nextDay(existing.expires_on) : t;
      await run(`UPDATE members SET name = ?, email = COALESCE(?, email), licence_no = COALESCE(?, licence_no), pan = COALESCE(?, pan), area = COALESCE(?, area),
              plan_id = ?, amount_paise = ?, paid_on = ?, expires_on = ?, payment_mode = 'online',
              status = CASE WHEN status = 'rejected' THEN 'pending' ELSE status END, updated_at = datetime('now') WHERE id = ?`,
        [meta.name, meta.email || null, meta.licence_no || null, meta.pan || null, meta.area || null, p.plan_id, p.amount_paise, t, addMonths(start, months), existing.id]);
      memberId = Number(existing.id); token = existing.token;
    } else {
      token = crypto.randomBytes(16).toString("hex");
      const r = await run(`INSERT INTO members (token, name, phone, email, licence_no, pan, area, plan_id, amount_paise, paid_on, expires_on, status, source, payment_mode)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'online', 'online')`,
        [token, meta.name, meta.phone, meta.email || null, meta.licence_no || null, meta.pan || null, meta.area || null, p.plan_id, p.amount_paise, t, addMonths(t, months)]);
      memberId = Number(r.lastInsertRowid);
    }
    await run("UPDATE documents SET member_id = ? WHERE order_id = ?", [memberId, orderId]);
    await run("UPDATE payments SET member_id = ? WHERE order_id = ?", [memberId, orderId]);
  }
  return { kind: p.kind, memberId, token };
}

export async function markFailed(orderId: string) {
  await run("UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'created'", [orderId]);
}

function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
