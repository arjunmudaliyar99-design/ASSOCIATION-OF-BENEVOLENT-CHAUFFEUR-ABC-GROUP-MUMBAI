import Link from "next/link";
import { memberCode, one, q, today } from "@/lib/db";
import { date, Field, Filters, inr, input, PageTitle, Pill, Stat } from "@/components/admin/ui";
import { adminDict } from "@/i18n";
import { LOAN_SELECT, loanStatus, monthsBetween, shortMonth, schemes, type LoanRow } from "@/lib/loans";

export const metadata = { title: "Loans" };
export const dynamic = "force-dynamic";

type Extra = { ref_name: string | null; ref_relation: string | null; ref_phone: string | null };
type Pay = { loan_id: number; kind: "repayment" | "interest" | "penalty"; amount_paise: number; paid_on: string; account: string | null };

const tabs = [["", "All loans"], ["10000", "₹10,000 loans"], ["small", "Short loans"]] as const;
const statusTone = (s: string) => (s === "open" ? "pending" : s === "closed" ? "paid" : "failed");
// One row per loan, laid out like the association's Excel sheet. Columns wrap instead of scrolling sideways.
const grid = "md:grid md:grid-cols-[2.6rem_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,2.2fr)_6.5rem] md:gap-4";

export default async function Loans({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; scheme?: string }> }) {
  const sp = await searchParams;
  const { lang, t } = await adminDict();
  const where: string[] = [], args: string[] = [];
  const term = sp.q?.trim();
  const scheme = sp.scheme && sp.scheme in schemes ? sp.scheme : "";
  if (term) { where.push("(l.name LIKE ? OR l.phone LIKE ? OR printf('ABC-%04d', l.member_id) LIKE ?)"); args.push(`%${term}%`, `%${term}%`, `%${term.toUpperCase()}%`); }
  if (sp.status && sp.status in loanStatus) { where.push("l.status = ?"); args.push(sp.status); }
  if (scheme) { where.push("l.scheme = ?"); args.push(scheme); }
  const [rows, s] = await Promise.all([
    q<LoanRow & Extra>(`SELECT x.*, l.ref_name, l.ref_relation, l.ref_phone FROM (${LOAN_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} GROUP BY l.id) x
      JOIN loans l ON l.id = x.id ORDER BY x.status = 'open' DESC, x.given_on DESC, x.id DESC`, args),
    one<{ lent: number; n: number; open_n: number; out: number; earned: number }>(`SELECT
        (SELECT COALESCE(SUM(amount_paise),0) FROM loans) AS lent, (SELECT COUNT(*) FROM loans) AS n,
        (SELECT COUNT(*) FROM loans WHERE status = 'open') AS open_n,
        (SELECT COALESCE(SUM(l.amount_paise - COALESCE((SELECT SUM(amount_paise) FROM loan_payments WHERE loan_id = l.id AND kind = 'repayment'),0)),0) FROM loans l WHERE l.status = 'open') AS out,
        (SELECT COALESCE(SUM(amount_paise),0) FROM loan_payments WHERE kind IN ('interest','penalty')) AS earned`),
  ]);
  const pays = rows.length ? await q<Pay>(`SELECT loan_id, kind, amount_paise, paid_on, account FROM loan_payments
    WHERE loan_id IN (SELECT id FROM loans l ${where.length ? `WHERE ${where.join(" AND ")}` : ""}) ORDER BY paid_on, id`, args) : [];
  const byLoan = new Map<number, Pay[]>();
  for (const p of pays) byLoan.set(p.loan_id, [...(byLoan.get(p.loan_id) ?? []), p]);
  const now = today();
  const qs = (k: string, v: string) => { const u = new URLSearchParams(Object.entries(sp).filter(([, x]) => x) as [string, string][]); if (v) u.set(k, v); else u.delete(k); const t = u.toString(); return `/admin/loans${t ? `?${t}` : ""}`; };

  return (
    <>
      <PageTitle section="loans" title={t.admin.home.loans} sub="Money lent to members, what has come back, and interest or penalty collected.">
        <Link href="/admin/loans/new" className="btn-primary !px-5 !py-2.5 !text-base">Give a loan</Link>
      </PageTitle>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Running loans" value={Number(s?.open_n ?? 0)} href="/admin/loans?status=open" />
        <Stat label="Still to come back" value={inr(s?.out)} hint="Unpaid amount on running loans" href="/admin/loans?status=open" />
        <Stat label="Total lent" value={inr(s?.lent)} hint={`${Number(s?.n ?? 0)} loans`} />
        <Stat label="Interest & penalty collected" value={inr(s?.earned)} />
      </div>

      <nav aria-label="Loan type" className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <Link key={k} href={qs("scheme", k)} aria-current={scheme === k ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-semibold ring-1 ring-line ${scheme === k ? "bg-ink text-sun" : "bg-card hover:bg-sun/60"}`}>{label}</Link>
        ))}
      </nav>
      <Filters>
        {scheme && <input type="hidden" name="scheme" value={scheme} />}
        <Field label="Search"><input name="q" defaultValue={term} placeholder="Name, mobile, ABC-…" className={`${input} w-56`} /></Field>
        <Field label="Status">
          <select name="status" defaultValue={sp.status ?? ""} className={input}>
            <option value="">All</option>
            {Object.entries(loanStatus).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </Filters>
      <p className="mb-3 text-ink/70">{rows.length} found</p>

      <div className="rounded-3xl bg-card ring-1 ring-line">
        <div className={`hidden rounded-t-3xl bg-sun/50 px-4 py-3 text-sm font-semibold ${grid}`}>
          <span>S.No</span><span>Borrower · reference</span><span>Loan given</span><span>Return paid</span><span>Interest / penalty paid</span><span>Status</span>
        </div>
        {!rows.length && <p className="p-8 text-center text-ink/60">No loans yet.</p>}
        <ol className="divide-y divide-line">
          {rows.map((r, i) => {
            const mine = byLoan.get(r.id) ?? [];
            const back = mine.filter((p) => p.kind === "repayment");
            const extra = mine.filter((p) => p.kind !== "repayment");
            const balance = Math.max(0, r.amount_paise - r.repaid);
            // ₹10,000 loans pay ₹300 every month until the loan is returned: show how many months are still unpaid.
            const end = r.status === "open" ? now : back.at(-1)?.paid_on ?? now;
            const due = r.scheme === "10000" ? Math.max(0, monthsBetween(r.given_on, end) - extra.filter((p) => p.kind === "interest").length) : 0;
            const ref = [r.ref_name, r.ref_relation].filter(Boolean).join(" · ");
            return (
              <li key={r.id} className={`grid gap-2 px-4 py-4 text-sm ${grid} ${r.status === "open" ? "" : "text-ink/75"}`}>
                <span className="font-mono text-ink/60">{i + 1}</span>
                <div className="min-w-0">
                  <Link href={`/admin/loans/${r.id}`} className="font-display text-base font-extrabold hover:underline">{r.name}</Link>
                  <p className="text-ink/70">
                    {r.member_id && <span className="font-mono font-bold text-ink">{memberCode(r.member_id)}</span>}
                    {r.member_id && r.phone && " · "}
                    {r.phone && <a href={`tel:+91${r.phone}`} className="underline">{r.phone}</a>}
                  </p>
                  {(ref || r.ref_phone) && <p className="text-xs text-ink/60">Ref: {ref}{ref && r.ref_phone && " · "}{r.ref_phone}</p>}
                </div>
                <div>
                  <p className="font-semibold tabular-nums">{inr(r.amount_paise)}</p>
                  <p className="text-ink/60">{date(r.given_on, lang)}</p>
                </div>
                <div>
                  {back.length ? back.map((p, k) => (
                    <p key={k}><span className="font-semibold tabular-nums">{inr(p.amount_paise)}</span> <span className="text-ink/60">{date(p.paid_on, lang)}</span>{p.account && <span className="block text-xs text-ink/60">{p.account}</span>}</p>
                  )) : <p className="text-ink/50">Not yet</p>}
                  {r.status === "open" && balance > 0 && <p className="font-semibold text-sindoor">Balance {inr(balance)}</p>}
                </div>
                <div className="flex flex-wrap content-start gap-1.5">
                  {extra.map((p, k) => (
                    <span key={k} title={`${p.kind === "interest" ? "Interest" : "Penalty"} paid ${date(p.paid_on, lang)}${p.account ? ` · ${p.account}` : ""}`}
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${p.kind === "interest" ? "bg-ink/10" : "bg-sindoor/10 text-sindoor"}`}>
                      {shortMonth(p.paid_on)} · {inr(p.amount_paise)}
                    </span>
                  ))}
                  {!extra.length && <span className="text-ink/50">–</span>}
                  {due > 0 && <span className="whitespace-nowrap rounded-full bg-sindoor px-2.5 py-1 text-xs font-bold text-paper">{due} month{due > 1 ? "s" : ""} unpaid</span>}
                </div>
                <div className="flex items-start gap-2 md:grid md:justify-items-start">
                  <Pill s={statusTone(r.status)} label={loanStatus[r.status as keyof typeof loanStatus]} />
                  <Link href={`/admin/loans/${r.id}`} className="rounded-full bg-sun/60 px-3 py-1 text-xs font-bold hover:bg-sun">Open</Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
