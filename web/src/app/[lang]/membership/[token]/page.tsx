import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { memberCode, one, today } from "@/lib/db";
import { site } from "@/data/site";
import { pageCtx } from "@/i18n";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => ({ title: (await pageCtx(params)).t.card.title, robots: { index: false, follow: false } });
export const dynamic = "force-dynamic";

type M = { plan_id: string | null; id: number; name: string; phone: string; plan_label: string | null; paid_on: string; expires_on: string; status: string; in_group: number };
const fmt = (d: string, lang = "en") => new Date(`${d}T00:00:00Z`).toLocaleDateString(`${lang}-IN`, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function Card({ params, searchParams }: { params: Promise<{ lang: string; token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const { lang, t, L } = await pageCtx(params);
  const c = t.card;
  const { new: isNew } = await searchParams;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  const m = await one<M>(`SELECT m.id, m.plan_id, m.name, m.phone, p.label AS plan_label, m.paid_on, m.expires_on, m.status, m.in_group
    FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE m.token = ?`, [token]);
  if (!m) notFound();
  const expired = m.expires_on < today();
  const state = m.status === "rejected" ? [c.rejected, "bg-sindoor text-white"] : expired ? [c.expired, "bg-sindoor text-white"] : m.status === "active" ? [c.active, "bg-ink text-sun"] : [c.waiting, "bg-paper text-ink"];

  return (
    <section className="glow min-h-[70vh]">
      <div className="wrap grid justify-items-center gap-8 py-16">
        {isNew && <p className="glass rounded-full px-5 py-2 font-semibold">{c.saved}</p>}
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-ink p-7 text-paper shadow-[0_40px_80px_-30px_rgb(var(--ink)/.7)]">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-sun/20" />
          <div className="relative flex items-center gap-3">
            <Image src="/logo.jpg" alt="" width={52} height={52} className="rounded-full ring-2 ring-sun" />
            <div className="leading-tight"><p className="font-display text-lg font-extrabold text-sun">{site.name}</p><p className="text-sm text-paper/70">{c.networkMembership}</p></div>
          </div>
          <p className="relative mt-8 font-display text-3xl font-extrabold">{m.name}</p>
          <p className="relative font-display text-xl tracking-widest text-sun">{memberCode(m.id)}</p>
          <dl className="relative mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-paper/60">{c.plan}</dt><dd className="font-semibold">{(m.plan_id && t.join.plans[m.plan_id]) || m.plan_label || "–"}</dd></div>
            <div><dt className="text-paper/60">{c.mobile}</dt><dd className="font-semibold">••••••{m.phone.slice(-4)}</dd></div>
            <div><dt className="text-paper/60">{c.paidOn}</dt><dd className="font-semibold">{fmt(m.paid_on, lang)}</dd></div>
            <div><dt className="text-paper/60">{c.validUntil}</dt><dd className="font-semibold">{fmt(m.expires_on, lang)}</dd></div>
          </dl>
          <p className={`relative mt-6 w-fit max-w-full rounded-full px-4 py-1.5 text-sm font-bold ${state[1]}`}>{state[0]}</p>
        </div>
        <div className="grid max-w-md gap-3 text-center text-ink/80">
          {m.status === "pending" && !expired && <p>{c.pendingNote.replace("{phone}", site.phone)}</p>}
          {(expired || m.status === "active") && <Link href={L("/contact")} className="btn-primary">{expired ? c.renew : c.renewEarly}</Link>}
          <Link href={L("/")} className="font-semibold underline">{t.common.home}</Link>
        </div>
      </div>
    </section>
  );
}
