import { one, q } from "@/lib/db";
import { causes } from "@/data/site";
import { date, Field, Filters, inr, input, PageTitle, Pager, PAGE, Pill, Table } from "@/components/admin/ui";
import { donationWhere } from "@/lib/adminQueries";

export const metadata = { title: "Donations" };

export default async function Donations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const w = donationWhere(sp);
  const [rows, tot] = await Promise.all([
    q<{ order_id: string; payment_id: string; name: string; email: string; phone: string; cause: string; pan: string; amount_paise: number; status: string; created_at: string }>(
      `SELECT * FROM payments WHERE ${w.sql} ORDER BY created_at DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`, w.args),
    one<{ n: number; sum: number }>(`SELECT COUNT(*) AS n, COALESCE(SUM(amount_paise),0) AS sum FROM payments WHERE ${w.sql}`, w.args),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]);
  const label = (id: string) => causes.find((c) => c.id === id)?.label ?? id;

  return (
    <>
      <PageTitle title="Donations" sub={`${Number(tot?.n ?? 0)} found · ${inr(tot?.sum)} total`}>
        <a href={`/api/admin/export?type=donations&${qs}`} className="btn-ghost !px-5 !py-2.5 !text-base">Download Excel (CSV)</a>
      </PageTitle>
      <Filters>
        <Field label="Search"><input name="q" defaultValue={sp.q} placeholder="Name, email, phone, payment ID" className={`${input} w-64`} /></Field>
        <Field label="Cause"><select name="cause" defaultValue={sp.cause ?? ""} className={input}><option value="">All</option>{causes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
        <Field label="Status"><select name="status" defaultValue={sp.status ?? "paid"} className={input}><option value="paid">Paid</option><option value="created">Started, not paid</option><option value="failed">Failed</option><option value="all">All</option></select></Field>
        <Field label="From"><input type="date" name="from" defaultValue={sp.from} className={input} /></Field>
        <Field label="To"><input type="date" name="to" defaultValue={sp.to} className={input} /></Field>
      </Filters>
      <Table head={["Date", "Name", "Contact", "Cause", "Amount", "PAN", "Payment ID", "Status"]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.order_id} className="hover:bg-sun/10">
            <td className="whitespace-nowrap px-4 py-3">{date(r.created_at)}</td>
            <td className="px-4 py-3 font-semibold">{r.name}</td>
            <td className="px-4 py-3">{r.email}<br /><span className="text-ink/60">{r.phone}</span></td>
            <td className="px-4 py-3">{label(r.cause)}</td>
            <td className="px-4 py-3 font-semibold tabular-nums">{inr(r.amount_paise)}</td>
            <td className="px-4 py-3 font-mono text-xs">{r.pan ?? "–"}</td>
            <td className="px-4 py-3 font-mono text-xs">{r.payment_id ?? "–"}</td>
            <td className="px-4 py-3"><Pill s={r.status} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={Number(tot?.n ?? 0)} qs={qs} base="/admin/donations" />
    </>
  );
}
