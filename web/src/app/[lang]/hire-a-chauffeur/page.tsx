import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { rates, site } from "@/data/site";
import { pageCtx, pageMeta } from "@/i18n";
import { fill } from "@/i18n/config";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.rates.title, description: t.rates.intro }), "/hire-a-chauffeur");

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function Rates({ params }: { params: Promise<{ lang: string }> }) {
  const { t } = await pageCtx(params);
  const r = t.rates;
  const wa = `https://wa.me/${site.whatsapp}`;
  const cards = [{ key: "standard", title: r.standard, d: rates.standard }, { key: "luxury", title: r.luxury, d: rates.luxury }] as const;

  return (
    <>
      <PageHero title={r.title} intro={r.intro} photo="/photos/drivers-felicitation-bus-event/03.jpg" />
      <section className="bg-paper">
        <div className="wrap grid gap-8 py-16 lg:grid-cols-2">
          {cards.map((c, ci) => (
            <Reveal key={c.key} delay={ci * 0.08} className={`overflow-hidden rounded-[2rem] ring-1 ring-line shadow-[0_30px_70px_-35px_rgb(var(--ink)/.5)] ${c.key === "luxury" ? "bg-ink text-paper" : "bg-card"}`}>
              <div className={`flex items-center justify-between gap-4 px-7 py-5 ${c.key === "luxury" ? "bg-sun text-ink" : "bg-sun/60"}`}>
                <h2 className="font-display text-3xl font-extrabold">{c.title}</h2>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 17h14M6 17l1-5 2-4h6l2 4 1 5M7 17v2M17 17v2M7.5 12h9" /><circle cx="8" cy="15" r=".5" /><circle cx="16" cy="15" r=".5" /></svg>
              </div>
              <div className="grid gap-6 p-7 sm:grid-cols-2">
                {[
                  { h: r.daily, big: inr(c.d.daily), sub: `${r.perDay} · ${fill(r.dutyHours, { h: c.d.dailyHours })}` },
                  { h: r.monthly, big: inr(c.d.monthly), sub: `${r.basic} · ${fill(r.dutyHours, { h: c.d.monthlyHours })}` },
                ].map((b) => (
                  <div key={b.h} className="grid gap-1">
                    <span className="text-sm font-semibold opacity-75">{b.h}</span>
                    <span className="font-display text-5xl font-extrabold leading-none tabular-nums">{b.big}</span>
                    <span className="text-sm opacity-75">{b.sub}</span>
                  </div>
                ))}
              </div>
              <dl className="grid gap-0 border-t border-current/10 px-7 pb-7">
                {[[r.extraHour, c.d.extra], [r.dinner, c.d.dinner], [r.travel, c.d.travel], [r.outUnder, c.d.outUnder], [r.outOver, c.d.outOver]].map(([k, v], i) => (
                  <div key={String(k)} className={`flex items-center justify-between gap-4 py-3 ${i ? "border-t border-current/10" : ""}`}>
                    <dt className={i > 2 ? "font-semibold" : ""}>{i === 3 ? `${r.outTitle}: ${k}` : i === 4 ? `${r.outTitle}: ${k}` : k}</dt>
                    <dd className="font-display text-xl font-extrabold tabular-nums">{inr(Number(v))}</dd>
                  </div>
                ))}
              </dl>
              <p className="px-7 pb-7 text-sm opacity-75">{r.outFood}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="bg-sun">
        <div className="wrap grid items-center gap-8 py-16 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="glass grid gap-4 rounded-[2rem] p-8">
            <h2 className="font-display text-3xl font-extrabold">{r.offerTitle}</h2>
            <ul className="grid gap-3 text-lg">
              {r.offers.map((o) => <li key={o} className="flex gap-3"><span aria-hidden className="mt-1.5 text-sindoor">★</span>{o}</li>)}
            </ul>
            <p className="pt-2 font-display font-bold text-ink/80">— {r.signed}</p>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary py-5 text-2xl">{r.book} · WhatsApp</a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="btn-ghost glass">{site.phone}</a>
            <a href={`tel:${site.phone2.replace(/\s/g, "")}`} className="btn-ghost glass">{site.phone2}</a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
