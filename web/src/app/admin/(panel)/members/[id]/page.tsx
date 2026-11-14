import Link from "next/link";
import { notFound } from "next/navigation";
import { memberCode, one, q, today } from "@/lib/db";
import { setInGroup, setMemberStatus } from "@/app/admin/actions";
import { date, inr, PageTitle, Pill, Table } from "@/components/admin/ui";
import { MemberEdit, OfflineRenewal } from "@/components/admin/MemberForms";

export const metadata = { title: "Member" };

export default async function Member({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const m = await one<{ id: number; token: string; name: string; phone: string; email: string | null; licence_no: string | null; pan: string | null; area: string | null; notes: string | null;
    plan_label: string | null; amount_paise: number; paid_on: string; expires_on: string; status: string; source: string; payment_mode: string | null; in_group: number; created_at: string }>(
    "SELECT m.*, p.label AS plan_label FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE m.id = ?", [id]);
  if (!m) notFound();
  const [payments, plans] = await Promise.all([
    q<{ order_id: string; payment_id: string; amount_paise: number; status: string; paid_at: string; plan_id: string }>("SELECT * FROM payments WHERE member_id = ? OR (kind = 'membership' AND phone = ?) ORDER BY created_at DESC", [id, m.phone]),
    q<{ id: string; label: string; price_paise: number }>("SELECT id, label, price_paise FROM plans ORDER BY sort"),
  ]);
  const expired = m.status === "active" && m.expires_on < today();
  const reminder = encodeURIComponent(`Namaste ${m.name}, your ABC Group Mumbai membership (${memberCode(m.id)}) ${expired ? "expired" : "expires"} on ${date(m.expires_on)}. Renew here: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/join?phone=${m.phone}`);

  return (
    <>
      <Link href="/admin/members" className="mb-3 inline-block font-semibold text-ink/70 hover:text-ink">← All members</Link>
      <PageTitle title={m.name} sub={`${memberCode(m.id)} · ${m.source === "imported" ? "Imported" : "Joined online"} on ${date(m.created_at)}`}>
        <a href={`https://wa.me/91${m.phone}?text=${reminder}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-5 !py-2.5 !text-base">WhatsApp reminder</a>
        <a href={`/membership/${m.token}`} target="_blank" className="btn-ghost !px-5 !py-2.5 !text-base">View card</a>
      </PageTitle>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-card p-5 ring-1 ring-line">
        <Pill s={expired ? "expired" : m.status} />
        <span>Valid until <b>{date(m.expires_on)}</b> · {m.plan_label ?? "–"} · {inr(m.amount_paise)} via {m.payment_mode ?? "–"}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          {m.status !== "active" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="active" /><button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-sun">Approve</button></form>}
          {m.status !== "rejected" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-full bg-sindoor/15 px-4 py-2 text-sm font-bold text-sindoor">Reject</button></form>}
          <form action={setInGroup}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="v" value={m.in_group ? "0" : "1"} /><button className={`rounded-full px-4 py-2 text-sm font-bold ${m.in_group ? "bg-ink text-sun" : "bg-line"}`}>{m.in_group ? "In WhatsApp group ✓" : "Mark added to group"}</button></form>
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <MemberEdit m={{ id: m.id, name: m.name, email: m.email ?? "", licence_no: m.licence_no ?? "", pan: m.pan ?? "", area: m.area ?? "", notes: m.notes ?? "", expires_on: m.expires_on, phone: m.phone }} />
        <OfflineRenewal id={m.id} plans={plans.map((p) => ({ id: p.id, label: p.label, price: Number(p.price_paise) / 100 }))} />
      </div>

      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">Online payments</h2>
      <Table head={["Date", "Amount", "Payment ID", "Status"]} empty={!payments.length}>
        {payments.map((p) => (
          <tr key={p.order_id}><td className="px-4 py-3">{date(p.paid_at)}</td><td className="px-4 py-3">{inr(p.amount_paise)}</td><td className="px-4 py-3 font-mono text-xs">{p.payment_id ?? "–"}</td><td className="px-4 py-3"><Pill s={p.status} /></td></tr>
        ))}
      </Table>
    </>
  );
}
