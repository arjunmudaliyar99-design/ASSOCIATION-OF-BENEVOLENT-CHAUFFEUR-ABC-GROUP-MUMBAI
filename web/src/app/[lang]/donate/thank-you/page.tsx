import Link from "next/link";
import { site } from "@/data/site";
import { pageCtx } from "@/i18n";

export const metadata = { title: "Thank you", robots: { index: false } };

export default async function ThankYou({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string; ok?: string }> }) {
  const { t, L } = await pageCtx(params);
  const d = t.donate;
  const { id, ok } = await searchParams;
  const confirmed = ok === "1";
  return (
    <section className="bg-sun">
      <div className="wrap grid max-w-2xl justify-items-center gap-6 py-24 text-center">
        <div className="grid h-24 w-24 animate-float place-items-center rounded-full bg-ink text-5xl text-sun" aria-hidden>♥</div>
        <h1 className="font-display text-5xl font-extrabold leading-tight">{confirmed ? d.thanksTitle : d.pendingTitle}</h1>
        <p className="text-xl opacity-90">{confirmed ? d.thanksBody : d.pendingBody.replace("{email}", site.email)}</p>
        {id && <p className="rounded-full bg-card px-4 py-2 font-semibold">{d.paymentId}: <span className="select-all">{id}</span></p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={L("/our-work")} className="btn-ghost">{d.seeWork}</Link>
          <Link href={L("/")} className="btn-primary">{t.common.home}</Link>
        </div>
      </div>
    </section>
  );
}
