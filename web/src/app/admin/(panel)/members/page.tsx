import Link from "next/link";
import { memberCode, one, q, today } from "@/lib/db";
import { memberWhere } from "@/lib/adminQueries";
import { setInGroup, setMemberStatus } from "@/app/admin/actions";
import { date, Field, Filters, inr, input, PageTitle, Pager, PAGE, Pill, Table } from "@/components/admin/ui";

export const metadata = { title: "Members" };

type M = { id: number; name: string; phone: string; licence_no: string | null; plan_label: string | null; amount_paise: number; paid_on: string; expires_on: string; status: string; source: string; in_group: number };

export default async function Members({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
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
      <PageTitle title="Members" sub={`${Number(tot?.n ?? 0)} found`}>
        <Link href="/admin/import" className="btn-ghost !px-5 !py-2.5 !text-base">Import from Excel</Link>
        <a href={`/api/admin/export?type=members&${qs}`} className="btn-ghost !px-5 !py-2.5 !text-base">Download Excel (CSV)</a>
      </PageTitle>
      <Filters>
        <Field label="Search"><input name="q" defaultValue={sp.q} placeholder="Name, mobile, licence, ABC-…" className={`${input} w-64`} /></Field>
        <Field label="Status"><select name="status" defaultValue={sp.status ?? "all"} className={input}>
          <option value="all">All</option><option value="pending">Waiting for approval</option><option value="active">Active</option><option value="expired">Expired</option><option value="rejected">Rejected</option></select></Field>
        <Field label="In WhatsApp group"><select name="group" defaultValue={sp.group ?? ""} className={input}><option value="">Any</option><option value="no">Not added yet</option><option value="yes">Added</option></select></Field>
        <Field label="Source"><select name="source" defaultValue={sp.source ?? ""} className={input}><option value="">Any</option><option value="online">Joined online</option><option value="imported">Imported</option></select></Field>
      </Filters>
      <Table head={["Member", "Mobile", "Plan", "Valid until", "Status", "WhatsApp group", "Actions"]} empty={!rows.length}>
        {rows.map((m) => {
          const expired = m.status === "active" && m.expires_on < t;
          return (
            <tr key={m.id} className="align-top hover:bg-sun/10">
              <td className="px-4 py-3"><Link href={`/admin/members/${m.id}`} className="font-semibold underline-offset-2 hover:underline">{m.name}</Link><br /><span className="font-mono text-xs text-ink/60">{memberCode(m.id)}{m.source === "imported" ? " · imported" : ""}</span></td>
              <td className="px-4 py-3"><a className="underline" href={`https://wa.me/91${m.phone}`} target="_blank" rel="noopener noreferrer">{m.phone}</a></td>
              <td className="px-4 py-3">{m.plan_label ?? "–"}<br /><span className="text-ink/60">{inr(m.amount_paise)} · {date(m.paid_on)}</span></td>
              <td className="whitespace-nowrap px-4 py-3">{date(m.expires_on)}</td>
              <td className="px-4 py-3"><Pill s={expired ? "expired" : m.status} label={m.status === "pending" ? "Waiting" : undefined} /></td>
              <td className="px-4 py-3">
                <form action={setInGroup}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="v" value={m.in_group ? "0" : "1"} />
                  <button className={`rounded-full px-3 py-1 text-xs font-bold ${m.in_group ? "bg-ink text-sun" : "bg-line"}`}>{m.in_group ? "Added ✓" : "Mark added"}</button></form>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {m.status !== "active" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="active" /><button className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-sun">Approve</button></form>}
                  {m.status === "pending" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-full bg-sindoor/15 px-3 py-1 text-xs font-bold text-sindoor">Reject</button></form>}
                  <Link href={`/admin/members/${m.id}`} className="rounded-full bg-line px-3 py-1 text-xs font-bold">Open</Link>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} total={Number(tot?.n ?? 0)} qs={qs} base="/admin/members" />
    </>
  );
}
