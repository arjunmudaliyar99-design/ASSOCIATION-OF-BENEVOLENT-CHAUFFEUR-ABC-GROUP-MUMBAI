import { one, q } from "@/lib/db";
import { causes } from "@/data/site";
import { date, Field, Filters, inr, input, PageTitle, Pager, PAGE, Pill, Table } from "@/components/admin/ui";
import { donationWhere } from "@/lib/adminQueries";
import { adminDict } from "@/i18n";

export const metadata = { title: "Donations" };

export default async function Donations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { lang, t: d } = await adminDict();
  const a = d.admin, dc = d.donate.causes;
  const page = Math.max(1, Number(sp.page) || 1);
  const w = donationWhere(sp);
  const [rows, tot] = await Promise.all([
    q<{ order_id: string; payment_id: string; name: string; email: string; phone: string; cause: string; pan: string; amount_paise: number; status: string; created_at: string }>(
      `SELECT * FROM payments WHERE ${w.sql} ORDER BY created_at DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`, w.args),
    one<{ n: number; sum: number }>(`SELECT COUNT(*) AS n, COALESCE(SUM(amount_paise),0) AS sum FROM payments WHERE ${w.sql}`, w.args),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]);
  const label = (id: string) => dc[id as keyof typeof dc] ?? causes.find((c) => c.id === id)?.label ?? id;

  return (
    <>
      <PageTitle title={a.nav.donations} sub={`${a.found.replace("{n}", String(Number(tot?.n ?? 0)))} · ${a.total.replace("{sum}", inr(tot?.sum))}`}>
        <a href={`/api/admin/export?type=donations&${qs}`} className="btn-ghost !px-5 !py-2.5 !text-base">{a.csv}</a>
      </PageTitle>
      <Filters apply={a.apply}>
        <Field label={a.search}><input name="q" defaultValue={sp.q} placeholder={a.donSearch} className={`${input} w-64`} /></Field>
        <Field label={a.th.cause}><select name="cause" defaultValue={sp.cause ?? ""} className={input}><option value="">{a.status.all}</option>{causes.map((c) => <option key={c.id} value={c.id}>{label(c.id)}</option>)}</select></Field>
        <Field label={a.th.status}><select name="status" defaultValue={sp.status ?? "paid"} className={input}><option value="paid">{a.status.paid}</option><option value="created">{a.status.created}</option><option value="failed">{a.status.failed}</option><option value="all">{a.status.all}</option></select></Field>
        <Field label={a.from}><input type="date" name="from" defaultValue={sp.from} className={input} /></Field>
        <Field label={a.to}><input type="date" name="to" defaultValue={sp.to} className={input} /></Field>
      </Filters>
      <Table head={[a.th.date, a.th.name, a.th.contact, a.th.cause, a.th.amount, a.th.pan, a.th.paymentId, a.th.status]} empty={!rows.length} emptyText={a.empty}>
        {rows.map((r) => (
          <tr key={r.order_id} className="hover:bg-sun/10">
            <td className="whitespace-nowrap px-4 py-3">{date(r.created_at, lang)}</td>
            <td className="px-4 py-3 font-semibold">{r.name}</td>
            <td className="px-4 py-3">{r.email}<br /><span className="text-ink/60">{r.phone}</span></td>
            <td className="px-4 py-3">{label(r.cause)}</td>
            <td className="px-4 py-3 font-semibold tabular-nums">{inr(r.amount_paise)}</td>
            <td className="px-4 py-3 font-mono text-xs">{r.pan ?? "–"}</td>
            <td className="px-4 py-3 font-mono text-xs">{r.payment_id ?? "–"}</td>
            <td className="px-4 py-3"><Pill s={r.status} label={a.status[r.status as keyof typeof a.status]} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={Number(tot?.n ?? 0)} qs={qs} base="/admin/donations" t={a} />
    </>
  );
}
