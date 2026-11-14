import Link from "next/link";
import { one, q, today } from "@/lib/db";
import { date, inr, PageTitle, Pill, Stat, Table } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

export default async function Overview() {
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
    q<{ order_id: string; kind: string; name: string; amount_paise: number; status: string; created_at: string }>(
      "SELECT order_id, kind, name, amount_paise, status, created_at FROM payments WHERE status = 'paid' ORDER BY paid_at DESC LIMIT 8"),
  ]);

  return (
    <>
      <PageTitle title="Overview" sub={`Today is ${date(t)}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Donations this month" value={inr(don?.month)} hint={`${don?.month_n ?? 0} donations`} href="/admin/donations" />
        <Stat label="Membership fees this month" value={inr(mem?.fees_month)} href="/admin/members" />
        <Stat label="Active members" value={Number(mem?.active ?? 0)} href="/admin/members?status=active" />
        <Stat label="Waiting for approval" value={Number(mem?.pending ?? 0)} hint="Paid online, check and approve" href="/admin/members?status=pending" />
        <Stat label="Expiring in 30 days" value={Number(mem?.expiring ?? 0)} href="/admin/renewals" />
        <Stat label="Expired" value={Number(mem?.expired ?? 0)} href="/admin/members?status=expired" />
        <Stat label="All-time donations" value={inr(don?.all)} hint={`${don?.all_n ?? 0} donations`} href="/admin/donations" />
      </div>
      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">Latest payments</h2>
      <Table head={["Date", "Type", "Name", "Amount", "Status"]} empty={!recent.length}>
        {recent.map((r) => (
          <tr key={r.order_id}>
            <td className="px-4 py-3">{date(r.created_at)}</td>
            <td className="px-4 py-3">{r.kind === "donation" ? "Donation" : "Membership"}</td>
            <td className="px-4 py-3 font-semibold">{r.name}</td>
            <td className="px-4 py-3 tabular-nums">{inr(r.amount_paise)}</td>
            <td className="px-4 py-3"><Pill s={r.status} /></td>
          </tr>
        ))}
      </Table>
      <p className="mt-4 text-sm text-ink/60">Need help? Every admin action is recorded. <Link href="/admin/import" className="underline">Import existing members</Link> from Excel.</p>
    </>
  );
}
