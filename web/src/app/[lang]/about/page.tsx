import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Photo from "@/components/Photo";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { leaders, leaderTiers, serviceKeys, site } from "@/data/site";
import { pageCtx, pageMeta } from "@/i18n";
import { fill } from "@/i18n/config";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.about.title, description: t.about.intro }), "/about");

const icons: Record<string, string> = {
  social: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z",
  medical: "M12 5v14M5 12h14",
  welfare: "M12 2l3 6 6 .9-4.5 4.4 1 6.2L12 16.6 6.5 19.5l1-6.2L3 8.9 9 8z",
  orphanage: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-5h4v5",
  sports: "M13 4a2 2 0 1 0 0-.01M7 21l3-6 3 2v4M6 12l3-3 4 1 3 3 3 1M10 15l-3-2",
};

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const { t, L } = await pageCtx(params);
  const a = t.about;
  return (
    <>
      <PageHero title={a.title} intro={a.intro} photo="/photos/drivers-felicitation-bus-event/05.jpg" />

      <section className="bg-paper">
        <div className="wrap grid items-center gap-12 py-20 lg:grid-cols-2">
          <Reveal className="grid gap-5 text-lg leading-relaxed">
            <h2 className="h-sec">{a.storyTitle}</h2>
            <p>{a.story1}</p>
            <p>{a.story2}</p>
            <p>{fill(a.story3, { reg: site.regNo })}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {serviceKeys.map((k) => (
                <li key={k} className="flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-base font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={icons[k]} /></svg>
                  {t.services[k]}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[12px_12px_0_rgb(var(--gold))]">
            <Photo src="/photos/drivers-felicitation-bus-event/17.jpg" alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Leadership */}
      <section className="relative overflow-hidden bg-sun">
        <div className="wrap grid gap-10 py-20">
          <Reveal><h2 className="h-sec">{a.leadersTitle}</h2></Reveal>
          {leaderTiers.map((tier) => (
          <div key={tier} className="grid gap-6">
          <Reveal><h3 className="font-display text-2xl font-extrabold">{a.tiers[tier]}</h3></Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.filter((p) => p.tier === tier).sort((x, y) => x.n - y.n).map((p, i) => {
              const photo = `/team/${p.n}.jpg`;
              const has = existsSync(join(process.cwd(), "public", photo));
              const initials = p.name.replace(/^[A-Z]\.\s*/, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
              return (
                <Reveal key={p.name} delay={(i % 3) * 0.08} className="glass group grid justify-items-center gap-4 rounded-[2rem] p-8 text-center transition duration-500 hover:-translate-y-1">
                  <span className="relative grid h-40 w-40 place-items-center overflow-hidden rounded-full bg-ink shadow-[0_20px_40px_-15px_rgb(var(--ink)/.6)] ring-4 ring-paper">
                    {has
                      ? <Image src={photo} alt={p.name} width={320} height={320} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                      : <span className="font-display text-5xl font-extrabold text-sun">{initials}</span>}
                  </span>
                  <span className="grid gap-2">
                    <span className="font-display text-2xl font-extrabold leading-tight">{p.name}</span>
                    <span className="mx-auto w-fit max-w-full rounded-full bg-ink px-4 py-1 text-sm font-bold text-sun">{a[p.role]}</span>
                  </span>
                </Reveal>
              );
            })}
          </div>
          </div>
          ))}
        </div>
      </section>

      {/* Purpose, from the association's letter */}
      <section className="bg-paper">
        <div className="wrap grid gap-8 py-20 lg:grid-cols-[1fr_1.4fr]">
          <Reveal><h2 className="h-sec">{a.purposeTitle}</h2></Reveal>
          <Reveal delay={0.08} className="grid gap-4 rounded-[2rem] bg-card p-8 text-lg leading-relaxed ring-1 ring-line">
            {a.purpose.map((p) => <p key={p} className="border-l-4 border-sun pl-4">{p}</p>)}
            <p className="pt-2 font-display font-bold text-ink/80">— {a.purposeSign}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-sun">
        <div className="wrap grid gap-6 py-20 md:grid-cols-2">
          {[{ h: a.visionTitle, p: a.vision }, { h: a.missionTitle, p: a.mission }].map((b, i) => (
            <Reveal key={b.h} delay={i * 0.1} className="glass grid gap-3 rounded-3xl p-8">
              <h2 className="font-display text-3xl font-extrabold">{b.h}</h2>
              <p className="text-lg leading-relaxed">{b.p}</p>
            </Reveal>
          ))}
        </div>
        <div className="wrap pb-16"><Link href={L("/contact")} className="btn-primary">{a.contactCta}</Link></div>
      </section>
    </>
  );
}
