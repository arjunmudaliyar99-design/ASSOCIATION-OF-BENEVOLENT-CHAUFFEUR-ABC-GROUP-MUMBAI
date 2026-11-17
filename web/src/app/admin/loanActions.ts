"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/auth";
import { memberCode, one, run, today } from "@/lib/db";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");
const rupees = z.coerce.number().positive("Enter an amount.").max(10_000_000);
const opt = (n: number) => z.string().trim().max(n).optional().transform((s) => s || null);
const phone = z.string().optional().transform((s) => s?.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "") || null)
  .refine((s) => !s || /^[6-9]\d{9}$/.test(s), "Enter a valid 10-digit mobile number.");

/** "ABC-0123", "abc 123" or "123" → 123. */
const memberNo = (s?: string | null) => {
  const m = s?.match(/(\d{1,6})\s*$/);
  return m ? Number(m[1]) : null;
};

const back = (path: string, err: string): never => redirect(`${path}?err=${encodeURIComponent(err)}`);

export async function createLoan(fd: FormData) {
  const admin = await requireAdmin();
  const p = z.object({
    member: opt(20), name: opt(80), phone, ref_name: opt(80), ref_relation: opt(40), ref_phone: phone,
    amount: rupees, given_on: day, scheme: z.enum(["small", "10000"]), notes: opt(500),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) back("/admin/loans/new", p.error.issues[0].message);
  const d = p.data!;
  const mid = memberNo(d.member);
  const m = mid ? await one<{ id: number; name: string; phone: string }>("SELECT id, name, phone FROM members WHERE id = ?", [mid]) : undefined;
  if (mid && !m) back("/admin/loans/new", `No member with ID ${memberCode(mid)}.`);
  const name = d.name ?? m?.name;
  if (!name) back("/admin/loans/new", "Enter the member ID or the borrower's name.");
  const r = await run(
    `INSERT INTO loans (member_id, name, phone, ref_name, ref_relation, ref_phone, amount_paise, given_on, scheme, notes, added_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [m?.id ?? null, name!, d.phone ?? m?.phone ?? null, d.ref_name, d.ref_relation, d.ref_phone, Math.round(d.amount * 100), d.given_on, d.scheme, d.notes, admin],
  );
  const id = Number(r.lastInsertRowid);
  await audit(admin, "loan given", `#${id} ${name} ₹${d.amount}`);
  revalidatePath("/admin/loans");
  redirect(`/admin/loans/${id}`);
}

export async function addLoanPayment(fd: FormData) {
  const admin = await requireAdmin();
  const loan = z.coerce.number().int().positive().parse(fd.get("loan"));
  const path = `/admin/loans/${loan}`;
  const p = z.object({ kind: z.enum(["repayment", "interest", "penalty"]), amount: rupees, paid_on: day, account: opt(40), note: opt(200) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) back(path, p.error.issues[0].message);
  const d = p.data!;
  await run("INSERT INTO loan_payments (loan_id, kind, amount_paise, paid_on, account, note, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [loan, d.kind, Math.round(d.amount * 100), d.paid_on, d.account, d.note, admin]);
  // Close the loan automatically once the full amount has been repaid.
  await run(`UPDATE loans SET status = 'closed', closed_on = ? WHERE id = ? AND status = 'open'
             AND amount_paise <= (SELECT COALESCE(SUM(amount_paise),0) FROM loan_payments WHERE loan_id = ? AND kind = 'repayment')`, [d.paid_on, loan, loan]);
  await audit(admin, `loan ${d.kind}`, `#${loan} ₹${d.amount}`);
  revalidatePath("/admin/loans", "layout");
  redirect(path);
}

export async function deleteLoanPayment(fd: FormData) {
  const admin = await requireAdmin();
  const loan = z.coerce.number().int().positive().parse(fd.get("loan"));
  const pay = z.coerce.number().int().positive().parse(fd.get("id"));
  await run("DELETE FROM loan_payments WHERE id = ? AND loan_id = ?", [pay, loan]);
  await audit(admin, "loan payment deleted", `#${loan} payment ${pay}`);
  revalidatePath("/admin/loans", "layout");
  redirect(`/admin/loans/${loan}`);
}

export async function setLoanStatus(fd: FormData) {
  const admin = await requireAdmin();
  const loan = z.coerce.number().int().positive().parse(fd.get("loan"));
  const status = z.enum(["open", "closed", "written_off"]).parse(fd.get("status"));
  await run("UPDATE loans SET status = ?, closed_on = ? WHERE id = ?", [status, status === "open" ? null : today(), loan]);
  await audit(admin, `loan ${status}`, `#${loan}`);
  revalidatePath("/admin/loans", "layout");
  redirect(`/admin/loans/${loan}`);
}
