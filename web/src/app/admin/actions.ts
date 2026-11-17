"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/auth";
import { addMonths, db, ensureSchema, memberCode, one, q, run, SYNC_MEMBER_PAYMENTS, today } from "@/lib/db";
import { adminMemberSchema, blacklistSchema, importRow, type ImportRow } from "@/lib/validate";
import { checkDoc, DOC_KINDS, saveDoc, type DocKind } from "@/lib/docs";
import { adminDict } from "@/i18n";
import { date } from "@/components/admin/ui";

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
  return (await adminDict()).t.admin.saved;
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
  await run(SYNC_MEMBER_PAYMENTS);
  await audit(admin, "offline renewal", `${memberCode(p.data.id)} ${p.data.amount} ${p.data.mode} until ${expires}`);
  revalidatePath("/admin", "layout");
  const { lang, t: dict } = await adminDict();
  return dict.admin.renewedUntil.replace("{date}", date(expires, lang));
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
  revalidatePath("/admin/members/new", "page");
  return (await adminDict()).t.admin.saved;
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
  await run(SYNC_MEMBER_PAYMENTS);
  await audit(admin, "import", `${good.length} imported, ${results.length - good.length} skipped`);
  revalidatePath("/admin", "layout");
  return { imported: good.length, updated: good.filter((g) => g.duplicate).length, skipped: results.length - good.length };
}

const fromDataUrl = (v: string) => new Uint8Array(Buffer.from(v.replace(/^data:[^,]*,/, ""), "base64"));

/** Admin onboards a member directly (no plan, no payment): details, valid-until date and optional documents. */
export async function createMember(input: unknown): Promise<{ error: string } | { id: number }> {
  const admin = await requireAdmin();
  const { t } = await adminDict();
  const p = adminMemberSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.expires_on < today()) return { error: t.admin.validPast };
  const dup = await one<{ id: number }>("SELECT id FROM members WHERE phone = ?", [d.phone]);
  if (dup) return { error: t.admin.phoneTaken.replace("{code}", memberCode(dup.id)) };
  const banned = await one<{ name: string }>("SELECT name FROM blacklist WHERE phone = ?", [d.phone]);
  if (banned) return { error: t.admin.bl.isBlacklisted.replace("{name}", banned.name) };

  const raw = ((input as { docs?: Record<string, unknown> })?.docs ?? {}) as Record<string, unknown>;
  const docs: { kind: DocKind; mime: string; buf: Uint8Array }[] = [];
  for (const kind of Object.keys(DOC_KINDS) as DocKind[]) {
    const v = raw[kind];
    if (typeof v !== "string" || !v) continue;
    const c = checkDoc(kind, fromDataUrl(v));
    if ("error" in c) return { error: c.error };
    docs.push({ kind, ...c });
  }

  const paise = Math.round(d.amount * 100);
  const paidOn = d.paid_on ?? today();
  if (paise > 0 && !d.payment_mode) return { error: t.admin.payModeNeeded };
  const r = await run(
    `INSERT INTO members (token, name, phone, email, area, plan_id, amount_paise, paid_on, expires_on, status, source, payment_mode, notes)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 'active', 'admin', ?, ?)`,
    [crypto.randomBytes(16).toString("hex"), d.name, d.phone, d.email ?? null, d.area ?? null, paise, paidOn, d.expires_on, paise > 0 ? d.payment_mode! : "none", d.reference ? `Payment ref: ${d.reference}` : null],
  );
  const memberId = Number(r.lastInsertRowid);
  if (paise > 0) await run(SYNC_MEMBER_PAYMENTS); // shows in Latest payments and the fee totals
  for (const doc of docs) await saveDoc({ ...doc, memberId, by: admin });
  await audit(admin, "member added by admin", `${memberCode(memberId)} (${docs.length} documents)`);
  revalidatePath("/admin", "layout");
  return { id: memberId };
}

/** Blacklist a person: details, an optional photo and up to 4 documents (photos or PDFs). */
export async function addBlacklist(input: unknown): Promise<{ error: string } | { id: number }> {
  const admin = await requireAdmin();
  const p = blacklistSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const raw = (input ?? {}) as { photo?: unknown; docs?: unknown };
  const files: { kind: string; mime: string; buf: Uint8Array }[] = [];
  if (typeof raw.photo === "string" && raw.photo) {
    const c = checkDoc("photo", fromDataUrl(raw.photo));
    if ("error" in c) return { error: c.error };
    if (c.mime === "application/pdf") return { error: "Photo: upload a JPG or PNG image." };
    files.push({ kind: "photo", ...c });
  }
  for (const v of (Array.isArray(raw.docs) ? raw.docs : []).slice(0, 4)) {
    if (typeof v !== "string" || !v) continue;
    const c = checkDoc("document", fromDataUrl(v));
    if ("error" in c) return { error: c.error };
    files.push({ kind: "document", ...c });
  }
  const r = await run("INSERT INTO blacklist (name, phone, reason, details, added_by) VALUES (?, ?, ?, ?, ?)", [d.name, d.phone ?? null, d.reason, d.details ?? null, admin]);
  const entry = Number(r.lastInsertRowid);
  for (const f of files) await run("INSERT INTO blacklist_files (entry_id, kind, mime, size, data) VALUES (?, ?, ?, ?, ?)", [entry, f.kind, f.mime, f.buf.length, f.buf]);
  await audit(admin, "blacklisted", `${d.name}${d.phone ? ` (${d.phone})` : ""}`);
  revalidatePath("/admin/blacklist");
  return { id: entry };
}

/** Moves a member to the blacklist: copies name, phone, ID and documents, then marks the member rejected (record kept). */
export async function moveToBlacklist(fd: FormData) {
  const admin = await requireAdmin();
  const { t } = await adminDict();
  const m = id.parse(fd.get("id"));
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 200) || t.admin.bl.fromMembers;
  const mem = await one<{ name: string; phone: string; notes: string | null }>("SELECT name, phone, notes FROM members WHERE id = ?", [m]);
  if (!mem) return;
  const details = `${t.admin.bl.fromMembers} (${memberCode(m)}).${mem.notes ? ` ${mem.notes}` : ""}`.slice(0, 1000);
  const r = await run("INSERT INTO blacklist (name, phone, reason, details, member_id, added_by) VALUES (?, ?, ?, ?, ?, ?)", [mem.name, mem.phone, reason, details, m, admin]);
  const entry = Number(r.lastInsertRowid);
  await run("INSERT INTO blacklist_files (entry_id, kind, mime, size, data) SELECT ?, 'document', mime, size, data FROM documents WHERE member_id = ?", [entry, m]);
  await run("UPDATE members SET status = 'rejected', in_group = 0, updated_at = datetime('now') WHERE id = ?", [m]);
  await audit(admin, "moved to blacklist", `${memberCode(m)} ${mem.name}`);
  revalidatePath("/admin", "layout");
}

export async function removeBlacklist(fd: FormData) {
  const admin = await requireAdmin();
  const e = id.parse(fd.get("id"));
  const row = await one<{ name: string }>("SELECT name FROM blacklist WHERE id = ?", [e]);
  await run("DELETE FROM blacklist_files WHERE entry_id = ?", [e]);
  await run("DELETE FROM blacklist WHERE id = ?", [e]);
  await audit(admin, "removed from blacklist", row?.name ?? String(e));
  revalidatePath("/admin/blacklist");
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
  return (await adminDict()).t.admin.uploaded;
}

export async function deleteDoc(fd: FormData) {
  const admin = await requireAdmin();
  const d = id.parse(fd.get("doc"));
  const row = await one<{ member_id: number; kind: string }>("SELECT member_id, kind FROM documents WHERE id = ?", [d]);
  await run("DELETE FROM documents WHERE id = ?", [d]);
  await audit(admin, "deleted document", `${row?.kind} ${row?.member_id ? memberCode(row.member_id) : ""}`);
  revalidatePath(`/admin/members/${row?.member_id}`);
}
