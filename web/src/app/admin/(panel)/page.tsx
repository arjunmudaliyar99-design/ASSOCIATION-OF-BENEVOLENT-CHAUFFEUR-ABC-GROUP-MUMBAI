import Link from "next/link";
import { memberCode, one, q, today } from "@/lib/db";
import { date, inr, PageTitle, Pill, Stat, Table } from "@/components/admin/ui";
import { adminDict } from "@/i18n";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const { lang, t: d } = await adminDict();
  const a = d.admin, st = a.stat;
  const t = today();
  const month = t.slice(0, 7);
  const in30 = new Date(Date.parse(`${t}T00:00:00Z`) + 30 * 864e5).toISOString().slice(0, 10);
  const [don, mem, recent] = await Promise.all([
    one<{ month: number; month_n: number; all: number; all_n: number }>(`SELECT
        COALESCE(SUM(CASE WHEN substr(paid_at,1,7) = ? THEN amount_paise END),0) AS month, COUNT(CASE WHEN substr(paid_at,1,7) = ? THEN 1 END) AS month_n,
        COALESCE(SUM(amount_paise),0) AS "all", COUNT(*) AS all_n
      FROM payments WHERE kind = 'donation' AND status = 'paid'`, [month, month]),
    one<{ active: number; pending: number; expiring: number; expired: number; fees_month: number }>(`SELECT
        COUNT(CASE WHEN status = 'active' AND expires_on >= ? THEN 1 END) AS active,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'active' AND expires_on BETWEEN ? AND ? THEN 1 END) AS expiring,
        COUNT(CASE WHEN status = 'active' AND expires_on < ? THEN 1 END) AS expired,
        (SELECT COALESCE(SUM(amount_paise),0) FROM payments WHERE kind = 'membership' AND status = 'paid' AND substr(paid_at,1,7) = ?) AS fees_month
      FROM members`, [t, t, in30, t, month]),
    q<{ order_id: string; kind: string; name: string; member_id: number | null; amount_paise: number; status: string; created_at: string }>(
      "SELECT order_id, kind, name, member_id, amount_paise, status, created_at FROM payments WHERE status = 'paid' ORDER BY paid_at DESC LIMIT 8"),
  ]);

  return (
    <>
      <PageTitle title={a.nav.overview} sub={a.today.replace("{date}", date(t, lang))} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={st.donMonth} value={inr(don?.month)} hint={st.donCount.replace("{n}", String(don?.month_n ?? 0))} href="/admin/donations" />
        <Stat label={st.feesMonth} value={inr(mem?.fees_month)} href="/admin/members" />
        <Stat label={st.active} value={Number(mem?.active ?? 0)} href="/admin/members?status=active" />
        <Stat label={st.waiting} value={Number(mem?.pending ?? 0)} hint={st.waitingHint} href="/admin/members?status=pending" />
        <Stat label={st.expiring} value={Number(mem?.expiring ?? 0)} href="/admin/renewals" />
        <Stat label={st.expired} value={Number(mem?.expired ?? 0)} href="/admin/members?status=expired" />
        <Stat label={st.donAll} value={inr(don?.all)} hint={st.donCount.replace("{n}", String(don?.all_n ?? 0))} href="/admin/donations" />
      </div>
      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">{a.latest}</h2>
      <Table head={[a.th.date, a.th.type, a.th.id, a.th.name, a.th.amount, a.th.status]} empty={!recent.length} emptyText={a.empty}>
        {recent.map((r) => (
          <tr key={r.order_id}>
            <td className="px-4 py-3">{date(r.created_at, lang)}</td>
            <td className="px-4 py-3">{r.kind === "donation" ? a.kind.donation : a.kind.membership}</td>
            <td className="whitespace-nowrap px-4 py-3 font-mono">{r.member_id ? memberCode(Number(r.member_id)) : "–"}</td>
            <td className="px-4 py-3 font-semibold">{r.name}</td>
            <td className="px-4 py-3 tabular-nums">{inr(r.amount_paise)}</td>
            <td className="px-4 py-3"><Pill s={r.status} label={a.status[r.status as keyof typeof a.status]} /></td>
          </tr>
        ))}
      </Table>
      <p className="mt-4 text-sm text-ink/60">{a.help} <Link href="/admin/import" className="underline">{a.nav.import}</Link></p>
    </>
  );
}
