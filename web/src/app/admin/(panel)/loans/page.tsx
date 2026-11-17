import Link from "next/link";
import { memberCode, one, q } from "@/lib/db";
import { date, Field, Filters, inr, input, PageTitle, Pill, Stat, Table } from "@/components/admin/ui";
import { adminDict } from "@/i18n";
import { LOAN_SELECT, loanStatus, schemes, type LoanRow } from "@/lib/loans";

export const metadata = { title: "Loans" };
export const dynamic = "force-dynamic";

export default async function Loans({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; scheme?: string }> }) {
  const sp = await searchParams;
  const { lang } = await adminDict();
  const where: string[] = [], args: string[] = [];
  const term = sp.q?.trim();
  if (term) { where.push("(l.name LIKE ? OR l.phone LIKE ? OR printf('ABC-%04d', l.member_id) LIKE ?)"); args.push(`%${term}%`, `%${term}%`, `%${term.toUpperCase()}%`); }
  if (sp.status && sp.status in loanStatus) { where.push("l.status = ?"); args.push(sp.status); }
  if (sp.scheme && sp.scheme in schemes) { where.push("l.scheme = ?"); args.push(sp.scheme); }
  const [rows, s] = await Promise.all([
    q<LoanRow>(`${LOAN_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} GROUP BY l.id ORDER BY l.status = 'open' DESC, l.given_on DESC`, args),
    one<{ lent: number; n: number; open_n: number; out: number; earned: number }>(`SELECT
        (SELECT COALESCE(SUM(amount_paise),0) FROM loans) AS lent, (SELECT COUNT(*) FROM loans) AS n,
        (SELECT COUNT(*) FROM loans WHERE status = 'open') AS open_n,
        (SELECT COALESCE(SUM(l.amount_paise - COALESCE((SELECT SUM(amount_paise) FROM loan_payments WHERE loan_id = l.id AND kind = 'repayment'),0)),0) FROM loans l WHERE l.status = 'open') AS out,
        (SELECT COALESCE(SUM(amount_paise),0) FROM loan_payments WHERE kind IN ('interest','penalty')) AS earned`),
  ]);

  return (
    <>
      <PageTitle title="Loans" sub="Money lent to members, what has come back, and interest or penalty collected.">
        <Link href="/admin/loans/new" className="btn-primary !px-5 !py-2.5 !text-base">Give a loan</Link>
      </PageTitle>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Running loans" value={Number(s?.open_n ?? 0)} href="/admin/loans?status=open" />
        <Stat label="Still to come back" value={inr(s?.out)} hint="Unpaid amount on running loans" href="/admin/loans?status=open" />
        <Stat label="Total lent" value={inr(s?.lent)} hint={`${Number(s?.n ?? 0)} loans`} />
        <Stat label="Interest & penalty collected" value={inr(s?.earned)} />
      </div>
      <Filters>
        <Field label="Search"><input name="q" defaultValue={term} placeholder="Name, mobile, ABC-…" className={`${input} w-56`} /></Field>
        <Field label="Status">
          <select name="status" defaultValue={sp.status ?? ""} className={input}>
            <option value="">All</option>
            {Object.entries(loanStatus).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Loan type">
          <select name="scheme" defaultValue={sp.scheme ?? ""} className={input}>
            <option value="">All</option>
            {Object.entries(schemes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </Filters>
      <p className="mb-3 text-ink/70">{rows.length} found</p>
      <Table head={["ID no", "Borrower", "Given on", "Loan", "Repaid", "Balance", "Interest / penalty", "Status", ""]} empty={!rows.length} emptyText="No loans yet.">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="whitespace-nowrap px-4 py-3 font-mono font-bold">{r.member_id ? memberCode(r.member_id) : "–"}</td>
            <td className="px-4 py-3"><Link href={`/admin/loans/${r.id}`} className="font-semibold hover:underline">{r.name}</Link>{r.phone && <span className="block text-ink/60">{r.phone}</span>}</td>
            <td className="whitespace-nowrap px-4 py-3">{date(r.given_on, lang)}</td>
            <td className="px-4 py-3 tabular-nums">{inr(r.amount_paise)}</td>
            <td className="px-4 py-3 tabular-nums">{inr(r.repaid)}</td>
            <td className="px-4 py-3 font-semibold tabular-nums">{r.status === "open" ? inr(Math.max(0, r.amount_paise - r.repaid)) : "–"}</td>
            <td className="px-4 py-3 tabular-nums">{inr(Number(r.interest) + Number(r.penalty))}</td>
            <td className="px-4 py-3"><Pill s={r.status === "open" ? "pending" : r.status === "closed" ? "paid" : "failed"} label={loanStatus[r.status as keyof typeof loanStatus]} /></td>
            <td className="px-4 py-3"><Link href={`/admin/loans/${r.id}`} className="rounded-full bg-sun/60 px-4 py-2 text-xs font-bold hover:bg-sun">Open</Link></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
