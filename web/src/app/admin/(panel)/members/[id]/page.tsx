/* eslint-disable @next/next/no-img-element -- private admin-only documents are served by our own route, not optimised */
import Link from "next/link";
import { notFound } from "next/navigation";
import { memberCode, one, q, today } from "@/lib/db";
import MemberMenu from "@/components/admin/MemberMenu";
import { deleteDoc, setInGroup, setMemberStatus } from "@/app/admin/actions";
import { date, inr, PageTitle, Pill, Table } from "@/components/admin/ui";
import { DocUpload, MemberEdit, OfflineRenewal } from "@/components/admin/MemberForms";
import { adminDict } from "@/i18n";

export const metadata = { title: "Member" };

export default async function Member({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const m = await one<{ id: number; token: string; name: string; phone: string; email: string | null; licence_no: string | null; pan: string | null; area: string | null; notes: string | null;
    plan_id: string | null; plan_label: string | null; amount_paise: number; paid_on: string; expires_on: string; status: string; source: string; payment_mode: string | null; in_group: number; created_at: string }>(
    "SELECT m.*, p.label AS plan_label FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE m.id = ?", [id]);
  if (!m) notFound();
  const { lang, t: d } = await adminDict();
  const a = d.admin;
  const planName = (id: string | null, fallback?: string | null) => (id && d.join.plans[id]) || fallback || "–";
  const [payments, plans, docs] = await Promise.all([
    q<{ order_id: string; payment_id: string; amount_paise: number; status: string; paid_at: string; plan_id: string }>("SELECT * FROM payments WHERE member_id = ? OR (kind = 'membership' AND phone = ?) ORDER BY created_at DESC", [id, m.phone]),
    q<{ id: string; label: string; price_paise: number }>("SELECT id, label, price_paise FROM plans ORDER BY sort"),
    q<{ id: number; kind: string; mime: string; size: number; uploaded_by: string; created_at: string }>("SELECT id, kind, mime, size, uploaded_by, created_at FROM documents WHERE member_id = ? ORDER BY created_at DESC", [id]),
  ]);
  const kinds: Record<string, string> = Object.fromEntries(([['aadhaar', d.join.aadhaar], ['pan', d.join.panCard], ['licence', d.join.licenceCard]] as const).flatMap(([k, n]) => [[`${k}_front`, `${n} – ${d.join.front}`], [`${k}_back`, `${n} – ${d.join.back}`]]));
  const legacy: Record<string, string> = { aadhaar: d.join.aadhaar, pan: d.join.panCard, licence: d.join.licenceCard };
  const expired = m.status === "active" && m.expires_on < today();
  const reminder = encodeURIComponent(a.reminderMsg.replace("{name}", m.name).replace("{code}", memberCode(m.id)).replace("{state}", expired ? a.reminderExpired : a.reminderExpires).replace("{date}", date(m.expires_on, lang)).replace("{link}", `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${lang === "en" ? "" : `/${lang}`}/contact`));

  return (
    <>
      <Link href="/admin/members" className="mb-3 inline-block font-semibold text-ink/70 hover:text-ink">{a.allMembers}</Link>
      <PageTitle title={m.name} sub={`${memberCode(m.id)} · ${a.joinedOn.replace("{how}", m.source === "imported" ? a.imported : m.source === "admin" ? a.byAdmin : a.online).replace("{date}", date(m.created_at, lang))}`}>
        <a href={`https://wa.me/91${m.phone}?text=${reminder}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-5 !py-2.5 !text-base">{a.waReminder}</a>
        <a href={`/membership/${m.token}`} target="_blank" className="btn-ghost !px-5 !py-2.5 !text-base">{a.viewCard}</a>
      </PageTitle>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-card p-5 ring-1 ring-line">
        <Pill s={expired ? "expired" : m.status} label={a.status[(expired ? "expired" : m.status) as keyof typeof a.status]} />
        <span>{a.validLine.replace("{date}", date(m.expires_on, lang)).replace("{plan}", planName(m.plan_id, m.plan_label)).replace("{amount}", inr(m.amount_paise)).replace("{mode}", ({ cash: a.cash, upi: a.upi, bank: a.bank, online: a.online } as Record<string, string>)[m.payment_mode ?? ""] ?? m.payment_mode ?? "–")}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          {m.status !== "active" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="active" /><button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-sun">{a.approve}</button></form>}
          {m.status !== "rejected" && <form action={setMemberStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-full bg-sindoor/15 px-4 py-2 text-sm font-bold text-sindoor">{a.reject}</button></form>}
          <form action={setInGroup}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="v" value={m.in_group ? "0" : "1"} /><button className={`rounded-full px-4 py-2 text-sm font-bold ${m.in_group ? "bg-ink text-sun" : "bg-line"}`}>{m.in_group ? a.inGroupTick : a.markGroup}</button></form>
          {m.status !== "rejected" && <MemberMenu id={m.id} name={m.name} t={a.bl} />}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <MemberEdit t={a} licenceLabel={d.join.licence} m={{ id: m.id, name: m.name, email: m.email ?? "", licence_no: m.licence_no ?? "", pan: m.pan ?? "", area: m.area ?? "", notes: m.notes ?? "", expires_on: m.expires_on, phone: m.phone }} />
        <OfflineRenewal t={a} id={m.id} plans={plans.map((p) => ({ id: p.id, label: planName(p.id, p.label), price: Number(p.price_paise) / 100 }))} />
      </div>

      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">{a.docs}</h2>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-3">
          {!docs.length && <p className="rounded-3xl bg-card p-6 text-ink/60 ring-1 ring-line">{a.noDocs}</p>}
          {docs.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-line">
              {doc.mime.startsWith("image/")
                ? <a href={`/api/admin/doc/${doc.id}`} target="_blank" className="block h-20 w-28 overflow-hidden rounded-xl bg-line"><img src={`/api/admin/doc/${doc.id}`} alt={kinds[doc.kind]} className="h-full w-full object-cover" /></a>
                : <a href={`/api/admin/doc/${doc.id}`} target="_blank" className="grid h-20 w-28 place-items-center rounded-xl bg-line font-bold">PDF</a>}
              <div className="min-w-0 flex-1"><b className="block">{kinds[doc.kind] ?? legacy[doc.kind] ?? doc.kind}</b><span className="text-sm text-ink/60">{a.docMeta.replace("{kb}", String(Math.round(doc.size / 1024))).replace("{date}", date(doc.created_at, lang)).replace("{by}", doc.uploaded_by)}</span></div>
              <a href={`/api/admin/doc/${doc.id}`} target="_blank" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-sun">{a.open}</a>
              <form action={deleteDoc}><input type="hidden" name="doc" value={doc.id} /><button className="rounded-full bg-sindoor/15 px-4 py-2 text-xs font-bold text-sindoor">{a.del}</button></form>
            </div>
          ))}
        </div>
        <DocUpload t={a} kinds={kinds} id={m.id} />
      </div>

      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">{a.onlinePayments}</h2>
      <Table head={[a.th.date, a.th.amount, a.th.paymentId, a.th.status]} empty={!payments.length} emptyText={a.empty}>
        {payments.map((p) => (
          <tr key={p.order_id}><td className="px-4 py-3">{date(p.paid_at, lang)}</td><td className="px-4 py-3">{inr(p.amount_paise)}</td><td className="px-4 py-3 font-mono text-xs">{p.payment_id ?? "–"}</td><td className="px-4 py-3"><Pill s={p.status} label={a.status[p.status as keyof typeof a.status]} /></td></tr>
        ))}
      </Table>
    </>
  );
}
