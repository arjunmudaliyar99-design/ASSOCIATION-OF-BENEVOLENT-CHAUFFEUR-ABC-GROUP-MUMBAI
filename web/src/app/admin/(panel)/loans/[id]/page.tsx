import Link from "next/link";
import { notFound } from "next/navigation";
import { memberCode, one, q, today } from "@/lib/db";
import { date, inr, input, PageTitle, Pill, Stat, Table } from "@/components/admin/ui";
import { addLoanPayment, deleteLoanPayment, setLoanStatus } from "@/app/admin/loanActions";
import { LOAN_SELECT, loanStatus, schemes, type LoanRow } from "@/lib/loans";
import { adminDict } from "@/i18n";

export const metadata = { title: "Loan" };
export const dynamic = "force-dynamic";

const kinds = { repayment: "Loan repaid", interest: "Interest", penalty: "Late penalty" } as const;
const lab = "grid gap-1 text-sm font-semibold";

export default async function LoanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  const id = Number((await params).id);
  const { err } = await searchParams;
  const { lang } = await adminDict();
  const l = Number.isInteger(id) ? await one<LoanRow & { ref_name: string | null; ref_relation: string | null; ref_phone: string | null; notes: string | null; closed_on: string | null; added_by: string }>(
    `SELECT x.*, l.ref_name, l.ref_relation, l.ref_phone, l.notes, l.closed_on, l.added_by FROM (${LOAN_SELECT} WHERE l.id = ? GROUP BY l.id) x JOIN loans l ON l.id = x.id`, [id]) : undefined;
  if (!l) notFound();
  const pays = await q<{ id: number; kind: keyof typeof kinds; amount_paise: number; paid_on: string; account: string | null; note: string | null }>(
    "SELECT id, kind, amount_paise, paid_on, account, note FROM loan_payments WHERE loan_id = ? ORDER BY paid_on, id", [id]);
  const balance = Math.max(0, l.amount_paise - l.repaid);
  const others = l.member_id ? await q<{ id: number; amount_paise: number; given_on: string; status: string }>(
    "SELECT id, amount_paise, given_on, status FROM loans WHERE member_id = ? AND id != ? ORDER BY given_on DESC", [l.member_id, id]) : [];

  return (
    <>
      <p className="mb-2"><Link href="/admin/loans" className="text-sm font-semibold underline">← All loans</Link></p>
      <PageTitle title={l.name} sub={`${l.member_id ? `${memberCode(l.member_id)} · ` : ""}${schemes[l.scheme as keyof typeof schemes] ?? l.scheme} · given ${date(l.given_on, lang)}`}>
        <Pill s={l.status === "open" ? "pending" : l.status === "closed" ? "paid" : "failed"} label={loanStatus[l.status as keyof typeof loanStatus]} />
      </PageTitle>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Loan amount" value={inr(l.amount_paise)} />
        <Stat label="Repaid" value={inr(l.repaid)} />
        <Stat label="Balance" value={inr(balance)} />
        <Stat label="Interest & penalty paid" value={inr(Number(l.interest) + Number(l.penalty))} />
      </div>

      <div className="mb-8 grid gap-4 rounded-3xl bg-card p-6 ring-1 ring-line sm:grid-cols-2">
        <p><span className="text-ink/60">Mobile</span><br />{l.phone ? <a href={`tel:+91${l.phone}`} className="font-semibold underline">{l.phone}</a> : "–"}</p>
        <p><span className="text-ink/60">Reference</span><br /><b>{[l.ref_name, l.ref_relation].filter(Boolean).join(" · ") || "–"}</b>{l.ref_phone && <> · <a href={`tel:+91${l.ref_phone}`} className="underline">{l.ref_phone}</a></>}</p>
        {l.notes && <p className="whitespace-pre-line sm:col-span-2"><span className="text-ink/60">Notes</span><br />{l.notes}</p>}
        <p className="text-sm text-ink/60 sm:col-span-2">Added by {l.added_by}{l.closed_on ? ` · closed ${date(l.closed_on, lang)}` : ""}</p>
        {l.member_id && <p className="sm:col-span-2"><Link href={`/admin/members/${l.member_id}`} className="font-semibold underline">Open member record</Link></p>}
      </div>

      <h2 className="mb-3 font-display text-2xl font-extrabold">Payments</h2>
      <Table head={["Date", "Type", "Amount", "Paid into", "Note", ""]} empty={!pays.length} emptyText="Nothing paid yet.">
        {pays.map((p) => (
          <tr key={p.id}>
            <td className="whitespace-nowrap px-4 py-3">{date(p.paid_on, lang)}</td>
            <td className="px-4 py-3">{kinds[p.kind] ?? p.kind}</td>
            <td className="px-4 py-3 tabular-nums">{inr(p.amount_paise)}</td>
            <td className="px-4 py-3">{p.account ?? "–"}</td>
            <td className="px-4 py-3">{p.note ?? ""}</td>
            <td className="px-4 py-3">
              <form action={deleteLoanPayment}><input type="hidden" name="loan" value={id} /><input type="hidden" name="id" value={p.id} />
                <button className="rounded-full bg-sindoor/15 px-3 py-1.5 text-xs font-bold text-sindoor hover:bg-sindoor/25">Delete</button></form>
            </td>
          </tr>
        ))}
      </Table>

      <form action={addLoanPayment} className="mt-6 grid gap-4 rounded-3xl bg-card p-6 ring-1 ring-line">
        <h3 className="font-display text-xl font-extrabold">Record a payment</h3>
        <input type="hidden" name="loan" value={id} />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <label className={lab}>Type
            <select name="kind" defaultValue={l.scheme === "10000" ? "interest" : "repayment"} className={input}>
              {Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className={lab}>Amount (₹)<input name="amount" type="number" min={1} step="1" required defaultValue={l.scheme === "10000" ? 300 : undefined} className={input} /></label>
          <label className={lab}>Date<input name="paid_on" type="date" defaultValue={today()} required className={input} /></label>
          <label className={lab}>Paid into<input name="account" list="accounts" placeholder="Group A/c" className={input} /></label>
          <label className={lab}>Note<input name="note" maxLength={200} className={input} /></label>
        </div>
        <datalist id="accounts"><option value="Group A/c" /><option value="Vicky A/c" /><option value="Cash" /></datalist>
        {err && <p role="alert" className="rounded-2xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</p>}
        <div><button className="btn-primary !px-6 !py-2.5 !text-base">Save payment</button></div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {(l.status === "open" ? [["closed", "Mark fully repaid"], ["written_off", "Write off (won't be repaid)"]] : [["open", "Reopen loan"]]).map(([s, label]) => (
          <form key={s} action={setLoanStatus}><input type="hidden" name="loan" value={id} /><input type="hidden" name="status" value={s} />
            <button className="btn-ghost !px-5 !py-2.5 !text-base">{label}</button></form>
        ))}
      </div>

      {!!others.length && (
        <>
          <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">Other loans to this member</h2>
          <ul className="grid gap-2">
            {others.map((o) => <li key={o.id}><Link href={`/admin/loans/${o.id}`} className="underline">{inr(o.amount_paise)} on {date(o.given_on, lang)}</Link> · {loanStatus[o.status as keyof typeof loanStatus]}</li>)}
          </ul>
        </>
      )}
    </>
  );
}
