import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { memberCode, one, today } from "@/lib/db";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Membership card", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type M = { id: number; name: string; phone: string; plan_label: string | null; paid_on: string; expires_on: string; status: string; in_group: number };
const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function Card({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const { new: isNew } = await searchParams;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  const m = await one<M>(`SELECT m.id, m.name, m.phone, p.label AS plan_label, m.paid_on, m.expires_on, m.status, m.in_group
    FROM members m LEFT JOIN plans p ON p.id = m.plan_id WHERE m.token = ?`, [token]);
  if (!m) notFound();
  const expired = m.expires_on < today();
  const state = m.status === "rejected" ? ["Not approved", "bg-sindoor text-white"] : expired ? ["Expired", "bg-sindoor text-white"] : m.status === "active" ? ["Active", "bg-ink text-sun"] : ["Paid, waiting for approval", "bg-paper text-ink"];

  return (
    <section className="glow min-h-[70vh]">
      <div className="wrap grid justify-items-center gap-8 py-16">
        {isNew && <p className="glass rounded-full px-5 py-2 font-semibold">Payment received. Save this page or take a screenshot.</p>}
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-ink p-7 text-paper shadow-[0_40px_80px_-30px_rgb(var(--ink)/.7)]">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-sun/20" />
          <div className="relative flex items-center gap-3">
            <Image src="/logo.jpg" alt="" width={52} height={52} className="rounded-full ring-2 ring-sun" />
            <div className="leading-tight"><p className="font-display text-lg font-extrabold text-sun">{site.name}</p><p className="text-sm text-paper/70">Drivers&apos; network membership</p></div>
          </div>
          <p className="relative mt-8 font-display text-3xl font-extrabold">{m.name}</p>
          <p className="relative font-display text-xl tracking-widest text-sun">{memberCode(m.id)}</p>
          <dl className="relative mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-paper/60">Plan</dt><dd className="font-semibold">{m.plan_label ?? "–"}</dd></div>
            <div><dt className="text-paper/60">Mobile</dt><dd className="font-semibold">••••••{m.phone.slice(-4)}</dd></div>
            <div><dt className="text-paper/60">Paid on</dt><dd className="font-semibold">{fmt(m.paid_on)}</dd></div>
            <div><dt className="text-paper/60">Valid until</dt><dd className="font-semibold">{fmt(m.expires_on)}</dd></div>
          </dl>
          <p className={`relative mt-6 w-max rounded-full px-4 py-1.5 text-sm font-bold ${state[1]}`}>{state[0]}</p>
        </div>
        <div className="grid max-w-md gap-3 text-center text-ink/80">
          {m.status === "pending" && !expired && <p>The association will check your details and add you to the WhatsApp group. If you have questions, call {site.phone}.</p>}
          {(expired || m.status === "active") && <Link href={`/join?phone=${m.phone}`} className="btn-primary">{expired ? "Renew membership" : "Renew early"}</Link>}
          <Link href="/" className="font-semibold underline">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
