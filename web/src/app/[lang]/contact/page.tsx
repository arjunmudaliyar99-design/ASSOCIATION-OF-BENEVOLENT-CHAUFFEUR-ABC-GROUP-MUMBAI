import Link from "next/link";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import { Reveal } from "@/components/Motion";
import { jobNetwork, site } from "@/data/site";
import { pageCtx, pageMeta } from "@/i18n";
import { fill } from "@/i18n/config";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.contact.title, description: t.contact.intro }), "/contact");

const icons = {
  call: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  whatsapp: "M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z",
  email: "M4 4h16v16H4z M4 6l8 7 8-7",
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z M17.5 6.5h0",
};

export default async function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { t, L } = await pageCtx(params);
  const c = t.contact;
  const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`;
  const items = [
    { k: "call" as const, h: c.call, lines: [[site.phone, tel(site.phone)], [site.phone2, tel(site.phone2)]] },
    { k: "whatsapp" as const, h: c.whatsapp, lines: [[site.phone, `https://wa.me/${site.whatsapp}`], [site.phone2, `https://wa.me/91${site.phone2.replace(/\D/g, "").slice(-10)}`]] },
    { k: "email" as const, h: c.email, lines: [[site.email, `mailto:${site.email}`]] },
    { k: "instagram" as const, h: c.instagram, lines: [[`@${site.instagram}`, `https://instagram.com/${site.instagram}`]] },
  ];
  return (
    <>
      <PageHero title={c.title} intro={c.intro} photo="/photos/drivers-felicitation-bus-event/13.jpg" />
      <section className="bg-paper">
        <div className="wrap grid gap-8 py-20 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.k} delay={i * 0.06} className="grid h-full gap-4 rounded-[1.75rem] bg-card p-7 ring-1 ring-line shadow-[0_20px_50px_-30px_rgb(var(--ink)/.5)]">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sun">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={icons[it.k]} /></svg>
                </span>
                <span className="font-display text-2xl font-extrabold">{it.h}</span>
                <span className="grid gap-1">
                  {it.lines.map(([label, link]) => (
                    <a key={link} href={link} target={link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="w-max break-all font-semibold underline-offset-4 hover:underline">{label}</a>
                  ))}
                </span>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="grid content-start gap-5 rounded-[1.75rem] bg-sun p-8 shadow-[0_20px_50px_-30px_rgb(var(--ink)/.5)]">
            <h2 className="font-display text-3xl font-extrabold">{c.office}</h2>
            <p className="text-lg">{site.address}</p>
            <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-max">{c.maps}</a>
          </Reveal>
        </div>
      </section>

      <section id="jobs" className="glow scroll-mt-24">
        <div className="wrap grid items-center gap-10 py-20 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="grid gap-5">
            <h2 className="h-sec">{c.jobsTitle}</h2>
            <p className="max-w-xl text-lg text-ink/80">{fill(c.jobsBody, { n: jobNetwork.members })}</p>
            <ul className="grid gap-3 text-lg">
              {c.jobsPoints.map((p) => <li key={p} className="flex items-start gap-3"><span aria-hidden className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-ink" />{p}</li>)}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href={L("/join")} className="btn-primary">{c.joinOnline}</Link>
              <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(c.waMessage)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">{c.ask}</a>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_70px_-25px_rgb(var(--ink)/.5)]">
            <Photo src="/photos/drivers-felicitation-bus-event/04.jpg" alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
