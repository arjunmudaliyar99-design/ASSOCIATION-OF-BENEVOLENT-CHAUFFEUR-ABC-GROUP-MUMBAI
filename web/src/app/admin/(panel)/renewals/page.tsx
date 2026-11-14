import Link from "next/link";
import { memberCode, q, today } from "@/lib/db";
import { date, PageTitle, Pill, Table } from "@/components/admin/ui";

export const metadata = { title: "Renewals" };

export default async function Renewals() {
  const t = today();
  const shift = (d: number) => new Date(Date.parse(`${t}T00:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
  const rows = await q<{ id: number; name: string; phone: string; expires_on: string }>(
    "SELECT id, name, phone, expires_on FROM members WHERE status = 'active' AND expires_on BETWEEN ? AND ? ORDER BY expires_on", [shift(-60), shift(30)]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const msg = (r: (typeof rows)[number]) => encodeURIComponent(
    `Namaste ${r.name}, your ABC Group Mumbai membership (${memberCode(r.id)}) ${r.expires_on < t ? "expired" : "expires"} on ${date(r.expires_on)}. Renew online here: ${site}/join?phone=${r.phone}`);

  return (
    <>
      <PageTitle title="Renewals" sub="Memberships that expire in the next 30 days or expired in the last 60 days. Tap “Send reminder” to open WhatsApp with the message ready." />
      <Table head={["Member", "Mobile", "Expiry", "", ""]} empty={!rows.length}>
        {rows.map((r) => {
          const left = Math.round((Date.parse(`${r.expires_on}T00:00:00Z`) - Date.parse(`${t}T00:00:00Z`)) / 864e5);
          return (
            <tr key={r.id}>
              <td className="px-4 py-3"><Link href={`/admin/members/${r.id}`} className="font-semibold hover:underline">{r.name}</Link><br /><span className="font-mono text-xs text-ink/60">{memberCode(r.id)}</span></td>
              <td className="px-4 py-3">{r.phone}</td>
              <td className="px-4 py-3">{date(r.expires_on)}</td>
              <td className="px-4 py-3"><Pill s={left < 0 ? "expired" : "pending"} label={left < 0 ? `Expired ${-left} days ago` : left === 0 ? "Expires today" : `${left} days left`} /></td>
              <td className="px-4 py-3"><a href={`https://wa.me/91${r.phone}?text=${msg(r)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-sun">Send reminder</a></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
