"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/auth";
import { addMonths, db, ensureSchema, memberCode, one, q, run, today } from "@/lib/db";
import { importRow, type ImportRow } from "@/lib/validate";
import { checkDoc, DOC_KINDS, saveDoc, type DocKind } from "@/lib/docs";

const id = z.coerce.number().int().positive();

export async function setMemberStatus(fd: FormData) {
  const admin = await requireAdmin();
  const m = id.parse(fd.get("id"));
  const status = z.enum(["active", "rejected", "pending"]).parse(fd.get("status"));
  await run("UPDATE members SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, m]);
  await audit(admin, `member ${status}`, memberCode(m));
  revalidatePath("/admin", "layout");
}

export async function setInGroup(fd: FormData) {
  const admin = await requireAdmin();
  const m = id.parse(fd.get("id"));
  const v = fd.get("v") === "1" ? 1 : 0;
  await run("UPDATE members SET in_group = ?, updated_at = datetime('now') WHERE id = ?", [v, m]);
  await audit(admin, v ? "added to group" : "removed from group", memberCode(m));
  revalidatePath("/admin", "layout");
}

const editSchema = z.object({
  id, name: z.string().trim().min(2).max(80), email: z.string().trim().max(120).optional(),
  licence_no: z.string().trim().max(30).optional(), pan: z.string().trim().toUpperCase().max(10).optional(),
  area: z.string().trim().max(80).optional(), notes: z.string().trim().max(500).optional(),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export async function updateMember(_: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const p = editSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return p.error.issues[0].message;
  const d = p.data;
  await run(`UPDATE members SET name = ?, email = ?, licence_no = ?, pan = ?, area = ?, notes = ?, expires_on = ?, updated_at = datetime('now') WHERE id = ?`,
    [d.name, d.email || null, d.licence_no || null, d.pan || null, d.area || null, d.notes || null, d.expires_on, d.id]);
  await audit(admin, "member edited", memberCode(d.id));
  revalidatePath("/admin", "layout");
  return "Saved.";
}

/** Record a renewal paid in cash/UPI outside the website. */
export async function recordOfflineRenewal(_: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const p = z.object({ id, planId: z.string(), amount: z.coerce.number().min(0).max(1_000_000), mode: z.string().max(20) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return "Check the renewal details.";
  const plan = await one<{ months: number }>("SELECT months FROM plans WHERE id = ?", [p.data.planId]);
  const m = await one<{ expires_on: string | null }>("SELECT expires_on FROM members WHERE id = ?", [p.data.id]);
  if (!plan || !m) return "Member or plan not found.";
  const t = today();
  const from = m.expires_on && m.expires_on >= t ? nextDay(m.expires_on) : t;
  const expires = addMonths(from, Number(plan.months));
  await run(`UPDATE members SET plan_id = ?, amount_paise = ?, paid_on = ?, expires_on = ?, payment_mode = ?, status = CASE WHEN status = 'rejected' THEN 'pending' ELSE status END, updated_at = datetime('now') WHERE id = ?`,
    [p.data.planId, Math.round(p.data.amount * 100), t, expires, p.data.mode, p.data.id]);
  await audit(admin, "offline renewal", `${memberCode(p.data.id)} ${p.data.amount} ${p.data.mode} until ${expires}`);
  revalidatePath("/admin", "layout");
  return `Renewed until ${expires}.`;
}

function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function savePlan(_: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const p = z.object({
    id: z.string().trim().regex(/^[a-z0-9-]{1,20}$/, "Plan code: lowercase letters, numbers and dashes only."),
    label: z.string().trim().min(2).max(40), months: z.coerce.number().int().min(1).max(120),
    price: z.coerce.number().min(1).max(1_000_000), active: z.string().optional(), sort: z.coerce.number().int().min(0).max(99).default(0),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return p.error.issues[0].message;
  const d = p.data;
  await run(`INSERT INTO plans (id, label, months, price_paise, active, sort) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET label = excluded.label, months = excluded.months, price_paise = excluded.price_paise, active = excluded.active, sort = excluded.sort`,
    [d.id, d.label, d.months, Math.round(d.price * 100), d.active ? 1 : 0, d.sort]);
  await audit(admin, "plan saved", `${d.id} ${d.label} ₹${d.price} ${d.months}m ${d.active ? "on" : "off"}`);
  revalidatePath("/admin/plans");
  revalidatePath("/join");
  return "Saved.";
}

export type RowResult = { row: number; ok: boolean; error?: string; data?: ImportRow; duplicate?: boolean; planId?: string };

async function checkRows(rows: Record<string, string>[]): Promise<RowResult[]> {
  const plans = await q<{ id: string; label: string; months: number }>("SELECT id, label, months FROM plans");
  const findPlan = (s: string) => {
    const t = s.toLowerCase().replace(/\s+/g, "");
    return plans.find((p) => p.id === t || p.label.toLowerCase().replace(/\s+/g, "") === t || `${p.months / 12}y` === t || `${p.months / 12}year` === t || `${p.months / 12}years` === t);
  };
  const seen = new Set<string>();
  const existing = new Set((await q<{ phone: string }>("SELECT phone FROM members")).map((r) => r.phone));
  return rows.map((raw, i) => {
    const norm = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.trim().toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, ""), (v ?? "").toString().trim()]));
    const r = importRow.safeParse({
      name: norm.full_name ?? norm.name, mobile: norm.mobile_number ?? norm.mobile ?? norm.phone, plan: norm.plan,
      amount: norm.amount_paid ?? norm.amount, paid_on: norm.paid_on_date ?? norm.paid_on ?? norm.paid_date,
      payment_mode: norm.payment_mode, expires_on: norm.expiry_date ?? norm.expires_on, licence_no: norm.licence_number ?? norm.license_number ?? norm.licence_no,
      pan: norm.pan, area: norm.area_address ?? norm.area, notes: norm.notes,
    });
    if (!r.success) return { row: i + 2, ok: false, error: r.error.issues[0].message };
    const plan = findPlan(r.data.plan);
    if (!plan) return { row: i + 2, ok: false, error: `Plan "${r.data.plan}" doesn't match any plan (${plans.map((p) => p.label).join(", ")})` };
    if (seen.has(r.data.mobile)) return { row: i + 2, ok: false, error: "Same mobile number appears earlier in the sheet" };
    seen.add(r.data.mobile);
    return { row: i + 2, ok: true, data: r.data, planId: plan.id, duplicate: existing.has(r.data.mobile) };
  });
}

export async function previewImport(rows: Record<string, string>[]) {
  await requireAdmin();
  if (!Array.isArray(rows) || rows.length > 5000) return { error: "The sheet must have between 1 and 5,000 rows." };
  return { results: await checkRows(rows) };
}

export async function commitImport(rows: Record<string, string>[]) {
  const admin = await requireAdmin();
  if (!Array.isArray(rows) || rows.length > 5000) return { error: "The sheet must have between 1 and 5,000 rows." };
  const results = await checkRows(rows);
  const good = results.filter((r) => r.ok);
  const plans = new Map((await q<{ id: string; months: number }>("SELECT id, months FROM plans")).map((p) => [p.id, Number(p.months)]));
  await ensureSchema();
  const stmts = good.map(({ data: d, planId }) => {
    const exp = d!.expires_on ?? addMonths(d!.paid_on, plans.get(planId!)!);
    return {
      sql: `INSERT INTO members (token, name, phone, licence_no, pan, area, plan_id, amount_paise, paid_on, expires_on, status, source, payment_mode, in_group, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'imported', ?, 1, ?)
            ON CONFLICT(phone) DO UPDATE SET name = excluded.name, licence_no = COALESCE(excluded.licence_no, licence_no), pan = COALESCE(excluded.pan, pan),
              area = COALESCE(excluded.area, area), plan_id = excluded.plan_id, amount_paise = excluded.amount_paise, paid_on = excluded.paid_on,
              expires_on = excluded.expires_on, payment_mode = excluded.payment_mode, notes = COALESCE(excluded.notes, notes), updated_at = datetime('now')`,
      args: [crypto.randomBytes(16).toString("hex"), d!.name, d!.mobile, d!.licence_no ?? null, d!.pan ?? null, d!.area ?? null, planId!, Math.round(d!.amount * 100), d!.paid_on, exp, d!.payment_mode, d!.notes ?? null],
    };
  });
  for (let i = 0; i < stmts.length; i += 200) await db().batch(stmts.slice(i, i + 200), "write");
  await audit(admin, "import", `${good.length} imported, ${results.length - good.length} skipped`);
  revalidatePath("/admin", "layout");
  return { imported: good.length, updated: good.filter((g) => g.duplicate).length, skipped: results.length - good.length };
}

export async function uploadDoc(_: unknown, fd: FormData) {
  const admin = await requireAdmin();
  const m = id.parse(fd.get("id"));
  const kind = String(fd.get("kind"));
  if (!(kind in DOC_KINDS)) return "Choose which document this is.";
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return "Choose a file.";
  const c = checkDoc(kind, new Uint8Array(await file.arrayBuffer()));
  if ("error" in c) return c.error;
  await saveDoc({ kind: kind as DocKind, mime: c.mime, buf: c.buf, memberId: m, by: admin });
  await audit(admin, "uploaded document", `${kind} ${memberCode(m)}`);
  revalidatePath(`/admin/members/${m}`);
  return "Uploaded.";
}

export async function deleteDoc(fd: FormData) {
  const admin = await requireAdmin();
  const d = id.parse(fd.get("doc"));
  const row = await one<{ member_id: number; kind: string }>("SELECT member_id, kind FROM documents WHERE id = ?", [d]);
  await run("DELETE FROM documents WHERE id = ?", [d]);
  await audit(admin, "deleted document", `${row?.kind} ${row?.member_id ? memberCode(row.member_id) : ""}`);
  revalidatePath(`/admin/members/${row?.member_id}`);
}
