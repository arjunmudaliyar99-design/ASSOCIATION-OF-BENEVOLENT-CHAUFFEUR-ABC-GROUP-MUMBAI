import Link from "next/link";
import { memberCode, q, today } from "@/lib/db";
import { date, PageTitle, Pill, Table } from "@/components/admin/ui";
import { adminDict } from "@/i18n";

export const metadata = { title: "Renewals" };

export default async function Renewals() {
  const { lang, t: d } = await adminDict();
  const a = d.admin;
  const t = today();
  const shift = (d: number) => new Date(Date.parse(`${t}T00:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
  const rows = await q<{ id: number; name: string; phone: string; expires_on: string }>(
    "SELECT id, name, phone, expires_on FROM members WHERE status = 'active' AND expires_on <= ? ORDER BY expires_on", [shift(30)]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const msg = (r: (typeof rows)[number]) => encodeURIComponent(a.reminderMsg.replace("{name}", r.name).replace("{code}", memberCode(r.id)).replace("{state}", r.expires_on < t ? a.reminderExpired : a.reminderExpires).replace("{date}", date(r.expires_on, lang)).replace("{link}", `${site}${lang === "en" ? "" : `/${lang}`}/contact`));

  return (
    <>
      <PageTitle section="renewals" title={a.nav.renewals} sub={a.renewalsSub} />
      <Table head={[a.th.id, a.th.member, a.th.mobile, a.th.expiry, "", ""]} empty={!rows.length} emptyText={a.empty}>
        {rows.map((r) => {
          const left = Math.round((Date.parse(`${r.expires_on}T00:00:00Z`) - Date.parse(`${t}T00:00:00Z`)) / 864e5);
          return (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-4 py-3 font-mono font-bold">{memberCode(r.id)}</td>
              <td className="px-4 py-3"><Link href={`/admin/members/${r.id}`} className="font-semibold hover:underline">{r.name}</Link></td>
              <td className="px-4 py-3">{r.phone}</td>
              <td className="px-4 py-3">{date(r.expires_on, lang)}</td>
              <td className="px-4 py-3"><Pill s={left < 0 ? "expired" : "pending"} label={left < 0 ? a.expiredAgo.replace("{n}", String(-left)) : left === 0 ? a.expiresToday : a.daysLeft.replace("{n}", String(left))} /></td>
              <td className="px-4 py-3"><a href={`https://wa.me/91${r.phone}?text=${msg(r)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-sun">{a.sendReminder}</a></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
