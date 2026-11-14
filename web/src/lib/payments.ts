import "server-only";
import crypto from "node:crypto";
import { addMonths, db, ensureSchema, one, run, today } from "@/lib/db";

export type MemberMeta = { name: string; phone: string; email?: string; licence_no?: string; pan?: string; area?: string; renew_of?: number };

/**
 * Marks an order paid exactly once (safe to call from both the browser verify step and the webhook).
 * For memberships, creates or extends the member. Returns the member id if any.
 */
export async function markPaid(orderId: string, paymentId: string): Promise<{ kind: string; memberId?: number; token?: string } | null> {
  await ensureSchema();
  const tx = await db().transaction("write");
  try {
    const p = (await tx.execute({ sql: "SELECT * FROM payments WHERE order_id = ?", args: [orderId] })).rows[0] as unknown as
      { kind: string; status: string; plan_id: string | null; member_id: number | null; amount_paise: number; meta: string | null } | undefined;
    if (!p) { await tx.rollback(); return null; }
    if (p.status === "paid") {
      await tx.rollback();
      if (p.member_id) {
        const m = await one<{ token: string }>("SELECT token FROM members WHERE id = ?", [p.member_id]);
        return { kind: p.kind, memberId: Number(p.member_id), token: m?.token };
      }
      return { kind: p.kind };
    }

    let memberId: number | undefined, token: string | undefined;
    if (p.kind === "membership") {
      const meta = JSON.parse(p.meta ?? "{}") as MemberMeta;
      const plan = (await tx.execute({ sql: "SELECT months FROM plans WHERE id = ?", args: [p.plan_id] })).rows[0] as unknown as { months: number };
      const existing = (await tx.execute({ sql: "SELECT id, token, status, expires_on FROM members WHERE phone = ?", args: [meta.phone] })).rows[0] as unknown as
        { id: number; token: string; status: string; expires_on: string | null } | undefined;
      const t = today();
      if (existing) {
        // Renewal: extend from the later of today or the current expiry.
        const start = existing.expires_on && existing.expires_on >= t ? nextDay(existing.expires_on) : t;
        await tx.execute({
          sql: `UPDATE members SET name = ?, email = COALESCE(?, email), licence_no = COALESCE(?, licence_no), pan = COALESCE(?, pan), area = COALESCE(?, area),
                plan_id = ?, amount_paise = ?, paid_on = ?, expires_on = ?, payment_mode = 'online',
                status = CASE WHEN status = 'rejected' THEN 'pending' ELSE status END, updated_at = datetime('now') WHERE id = ?`,
          args: [meta.name, meta.email || null, meta.licence_no || null, meta.pan || null, meta.area || null, p.plan_id, p.amount_paise, t, addMonths(start, plan.months), existing.id],
        });
        memberId = Number(existing.id); token = existing.token;
      } else {
        token = crypto.randomBytes(16).toString("hex");
        const r = await tx.execute({
          sql: `INSERT INTO members (token, name, phone, email, licence_no, pan, area, plan_id, amount_paise, paid_on, expires_on, status, source, payment_mode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'online', 'online')`,
          args: [token, meta.name, meta.phone, meta.email || null, meta.licence_no || null, meta.pan || null, meta.area || null, p.plan_id, p.amount_paise, t, addMonths(t, plan.months)],
        });
        memberId = Number(r.lastInsertRowid);
      }
    }
    if (memberId) await tx.execute({ sql: "UPDATE documents SET member_id = ? WHERE order_id = ?", args: [memberId, orderId] });
    await tx.execute({
      sql: "UPDATE payments SET status = 'paid', payment_id = ?, paid_at = datetime('now'), member_id = COALESCE(?, member_id) WHERE order_id = ?",
      args: [paymentId, memberId ?? null, orderId],
    });
    await tx.commit();
    return { kind: p.kind, memberId, token };
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  }
}

export async function markFailed(orderId: string) {
  await run("UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'created'", [orderId]);
}

function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
