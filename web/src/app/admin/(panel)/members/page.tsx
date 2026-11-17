import Link from "next/link";
import { memberCode, one, q, today } from "@/lib/db";
import { memberWhere } from "@/lib/adminQueries";
import { setInGroup, setMemberStatus } from "@/app/admin/actions";
import { date, Field, Filters, inr, input, PageTitle, Pager, PAGE, Pill, Table } from "@/components/admin/ui";
import { adminDict } from "@/i18n";
import MemberMenu from "@/components/admin/MemberMenu";

export const metadata = { title: "Members" };

type M = { plan_id: string | null; id: number; name: string; phone: string; licence_no: string | null; plan_label: string | null; amount_paise: number; paid_on: string; expires_on: string; status: string; source: string; in_group: number };

export default async function Members({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { lang, t: d } = await adminDict();
  const a = d.admin;
  const planName = (m: M) => (m.plan_id && d.join.plans[m.plan_id]) || m.plan_label || "–";
  const t = today();
  const page = Math.max(1, Number(sp.page) || 1);
  const w = memberWhere(sp, t), wm = memberWhere(sp, t, "m.");
  const [rows, tot] = await Promise.all([
    q<M>(`SELECT m.*, p.label AS plan_label FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE ${wm.sql}
          ORDER BY CASE m.status WHEN 'pending' THEN 0 ELSE 1 END, m.updated_at DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`, wm.args),
    one<{ n: number }>(`SELECT COUNT(*) AS n FROM members WHERE ${w.sql}`, w.args),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]);

  return (
    <>
      <PageTitle section="members" title={a.nav.members} sub={a.found.replace("{n}", String(Number(tot?.n ?? 0)))}>
        <Link href="/admin/members/new" className="btn-primary !px-5 !py-2.5 !text-base">{a.addMember}</Link>
        <Link href="/admin/import" className="btn-ghost !px-5 !py-2.5 !text-base">{a.importBtn}</Link>
        <a href={`/api/admin/export?type=members&${qs}`} className="btn-ghost !px-5 !py-2.5 !text-base">{a.csv}</a>
      </PageTitle>
      <Filters apply={a.apply}>
        <Field label={a.search}><input name="q" defaultValue={sp.q} placeholder={a.memSearch} className={`${input} w-64`} /></Field>
        <Field label={a.th.status}><select name="status" defaultValue={sp.status ?? "all"} className={input}>
          <option value="all">{a.status.all}</option><option value="pending">{a.stat.waiting}</option><option value="active">{a.status.active}</option><option value="expired">{a.status.expired}</option><option value="rejected">{a.status.rejected}</option></select></Field>
        <Field label={a.inGroup}><select name="group" defaultValue={sp.group ?? ""} className={input}><option value="">{a.any}</option><option value="no">{a.notAdded}</option><option value="yes">{a.addedYes}</option></select></Field>
        <Field label={a.source}><select name="source" defaultValue={sp.source ?? ""} className={input}><option value="">{a.any}</option><option value="online">{a.online}</option><option value="imported">{a.imported}</option><option value="admin">{a.byAdmin}</option></select></Field>
      </Filters>
      <Table head={[a.th.id, a.th.member, a.th.mobile, a.th.plan, a.th.validUntil, a.th.status, a.th.group, a.th.actions]} empty={!rows.length} emptyText={a.empty}>
        {rows.map((m) => {
          const expired = m.status === "active" && m.expires_on < t;
          return (
            <tr key={m.id} className="align-top hover:bg-sun/10">
              <td className="whitespace-nowrap px-4 py-3 font-mono font-bold">{memberCode(m.id)}</td>
              <td className="px-4 py-3"><Link href={`/admin/members/${m.id}`} className="font-semibold underline-offset-2 hover:underline">{m.name}</Link><br /><span className="text-xs text-ink/60">{m.source === "imported" ? a.imported : m.source === "admin" ? a.byAdmin : ""}</span></td>
              <td className="px-4 py-3"><a className="underline" href={`https://wa.me/91${m.phone}`} target="_blank" rel="noopener noreferrer">{m.phone}</a></td>
              <td className="px-4 py-3">{planName(m)}<br /><span className="text-ink/60">{inr(m.amount_paise)} · {date(m.paid_on, lang)}</span></td>
              <td className="whitespace-nowrap px-4 py-3">{date(m.expires_on, lang)}</td>
              <td className="px-4 py-3"><Pill s={expired ? "expired" : m.status} label={a.status[(expired ? "expired" : m.status) as keyof typeof a.status]} /></td>
              <td className="px-4 py-3">
                <form action={setInGroup}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="v" value={m.in_group ? "0" : "1"} />
                  <button className={`rounded-full px-3 py-1 text-xs font-bold ${m.in_group ? "bg-ink text-sun" : "bg-line"}`}>{m.in_group ? a.addedTick : a.markAdded}</button></form>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {m.status !== "active" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="active" /><button className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-sun">{a.approve}</button></form>}
                  {m.status === "pending" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-full bg-sindoor/15 px-3 py-1 text-xs font-bold text-sindoor">{a.reject}</button></form>}
                  <Link href={`/admin/members/${m.id}`} className="rounded-full bg-line px-3 py-1 text-xs font-bold">{a.open}</Link>
                  {m.status !== "rejected" && <MemberMenu id={m.id} name={m.name} t={a.bl} />}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} total={Number(tot?.n ?? 0)} qs={qs} base="/admin/members" t={a} />
    </>
  );
}
