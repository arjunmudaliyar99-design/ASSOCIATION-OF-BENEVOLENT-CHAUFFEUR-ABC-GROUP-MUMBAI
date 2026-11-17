import Link from "next/link";
import Aurora from "@/components/Aurora";
import Photo from "@/components/Photo";
import Slider from "@/components/Slider";
import PhotoMarquee from "@/components/PhotoMarquee";
import { CountUp, Reveal } from "@/components/Motion";
import { jobNetwork, objectives, site } from "@/data/site";
import { albums } from "@/data/gallery";
import { pageCtx } from "@/i18n";
import { fill } from "@/i18n/config";

// [photo, caption index, focus]. The two felicitation photos lead, framed on the people and the ABC banner.
const heroPhotos: [string, number, string][] = [
  ["/photos/hero/0.jpg", 2, "0% 45%"],
  ["/photos/hero/1.jpg", 0, "50% 62%"],
  ["/photos/hero/2.jpg", 0, "50% 58%"],
  ["/photos/ashram-food-seva/03.jpg", 1, "50% 50%"],
  ["/photos/childrens-home-visit/07.jpg", 2, "50% 50%"],
  ["/photos/grocery-supplies-drive/01.jpg", 3, "50% 50%"],
  ["/photos/ashram-food-seva/13.jpg", 4, "50% 50%"],
];

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t, L } = await pageCtx(params);
  const h = t.home;
  const heroSlides = heroPhotos.map(([src, c, focus]) => ({ src, caption: h.slides[c], focus }));
  const all = albums.flatMap((a) => a.photos);
  const rows: [typeof all, typeof all] = [all.filter((_, i) => i % 2 === 0).slice(0, 14), all.filter((_, i) => i % 2 === 1).slice(0, 14)];
  const words = t.org.motto.split(/(?<=\.)\s+/);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sun">
        <Aurora />
        <div className="wrap relative grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pb-28 lg:pt-16">
          <div className="grid min-w-0 gap-7">
            <p className="glass animate-rise w-fit max-w-full rounded-3xl px-4 py-2 text-sm font-semibold">{fill(t.org.regTrust, { reg: site.regNo })}</p>
            <h1 className={`font-display font-extrabold leading-[.95] tracking-tight ${["ta", "kn", "te", "ml"].includes(lang) ? "text-[clamp(2.1rem,6vw,5rem)] leading-[1.1]" : "text-[clamp(2.8rem,7vw,6.25rem)]"}`}>
              {words.map((w, i) => (
                <span key={w} className="block overflow-hidden pb-1"><span className="block animate-wordup" style={{ animationDelay: `${120 + i * 140}ms` }}>{w}</span></span>
              ))}
            </h1>
            <p className="animate-rise max-w-xl text-xl leading-relaxed text-ink/80" style={{ animationDelay: "520ms" }}>{h.intro}</p>
            <div className="animate-rise flex flex-wrap gap-4" style={{ animationDelay: "620ms" }}>
              <Link href={L("/donate")} className="btn-primary">{h.donateCta}</Link>
              <Link href={L("/our-work")} className="btn-ghost glass">{h.workCta}</Link>
            </div>
          </div>
          <div className="animate-rise relative h-[22rem] sm:h-[30rem] lg:h-[36rem]" style={{ animationDelay: "300ms" }}>
            <Slider slides={heroSlides} t={t.slider} className="h-full [&>div]:h-full" sizes="(min-width:1024px) 55vw, 100vw" priority />
            <div className="glass absolute -left-4 top-10 hidden animate-float rounded-2xl px-5 py-3 sm:block lg:-left-10">
              <p className="font-display text-3xl font-extrabold leading-none">₹0</p>
              <p className="text-sm font-semibold text-ink/75">{h.chipCommission}</p>
            </div>
            <div className="glass absolute -right-4 bottom-24 hidden animate-float rounded-2xl px-5 py-3 [animation-delay:-3s] sm:block lg:-right-8">
              <p className="font-display text-3xl font-extrabold leading-none">{jobNetwork.members}</p>
              <p className="text-sm font-semibold text-ink/75">{h.chipNetwork}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facts, all from the association's own documents */}
      <section className="relative overflow-hidden bg-honey">
        <div aria-hidden className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-sun blur-3xl" />
        <div aria-hidden className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-paper/60 blur-3xl" />
        <div className="wrap relative grid grid-cols-2 gap-4 py-12 lg:grid-cols-4 lg:gap-6">
          {[
            { n: "2023", l: h.stats.year },
            { n: <>₹<CountUp to={0} /></>, l: h.stats.commission },
            { n: <CountUp to={7} />, l: h.stats.areas },
            { n: jobNetwork.members, l: h.stats.network },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08} className="glass grid gap-1 rounded-3xl px-4 py-7 text-center transition duration-500 hover:-translate-y-1">
              <span className="font-display text-5xl font-extrabold lg:text-6xl">{s.n}</span>
              <span className="text-ink/75">{s.l}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Work */}
      <section className="bg-paper">
        <div className="wrap grid gap-12 py-20 lg:py-28">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="grid max-w-2xl gap-4">
              <h2 className="h-sec">{h.whatTitle}</h2>
              <p className="text-lg text-ink/75">{h.whatBody}</p>
            </div>
            <Link href={L("/our-work")} className="btn-ghost">{h.allWork}</Link>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {objectives.map((o, i) => {
              const ot = t.objectives[o.slug as keyof typeof t.objectives];
              return (
                <Reveal key={o.slug} delay={(i % 4) * 0.07} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
                  <Link href={L(`/our-work#${o.slug}`)} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card shadow-[0_20px_50px_-30px_rgb(var(--ink)/.5)] ring-1 ring-line transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-28px_rgb(var(--ink)/.55)]">
                    <div className={`relative overflow-hidden ${i === 0 ? "aspect-[16/10] lg:flex-1" : "aspect-[4/3]"}`}>
                      <Photo src={o.photo} alt="" fill sizes="(min-width:1024px) 50vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-110" />
                      <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-sun font-display text-lg font-extrabold shadow">{i + 1}</span>
                    </div>
                    <div className="grid gap-2 p-6">
                      <h3 className={`font-extrabold leading-tight ${i === 0 ? "text-3xl" : "text-xl"}`}>{ot.title}</h3>
                      <p className="text-ink/75">{ot.body}</p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job network + hire a driver */}
      <section className="relative overflow-hidden bg-sun">
        <Aurora />
        <div className="wrap relative grid gap-8 py-20 lg:grid-cols-2">
          <Reveal className="glass grid content-start gap-5 rounded-[2rem] p-8 lg:p-10">
            <h2 className="h-sec">{fill(h.networkTitle, { n: jobNetwork.members })}</h2>
            <p className="max-w-xl text-lg text-ink/80">{h.networkBody}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={L("/contact")} className="btn-primary">{h.networkCta}</Link>
              <Link href={L("/member-benefits")} className="btn-ghost">{t.nav.benefits}</Link>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative grid min-h-[22rem] overflow-hidden rounded-[2rem] shadow-[0_30px_70px_-25px_rgb(var(--ink)/.5)]">
            <Photo src="/photos/drivers-felicitation-bus-event/01.jpg" alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
            <div className="relative grid content-end gap-3 p-8 text-paper">
              <h3 className="font-display text-3xl font-extrabold text-sun">{h.hireTitle}</h3>
              <p className="max-w-md text-paper/90">{h.hireBody}</p>
              <Link href={L("/hire-a-chauffeur")} className="btn w-fit max-w-full bg-sun text-ink hover:-translate-y-0.5">{h.hireCta}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Photo marquee */}
      <section className="overflow-hidden bg-paper py-20 lg:py-28">
        <div className="wrap mb-10 flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className="h-sec">{h.momentsTitle}</h2></Reveal>
          <Link href={L("/gallery")} className="btn-ghost">{h.openGallery}</Link>
        </div>
        <PhotoMarquee rows={rows} />
      </section>

      {/* Donate CTA */}
      <section className="bg-sun">
        <div className="wrap py-16">
          <Reveal className="relative grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-ink p-10 text-paper md:grid-cols-[1.5fr_1fr] md:p-16">
            <div aria-hidden className="absolute -right-20 -top-20 h-80 w-80 animate-spin-slow rounded-full border-[36px] border-sun/20" />
            <div className="relative grid gap-4">
              <h2 className="h-sec text-sun">{h.ctaTitle}</h2>
              <p className="max-w-xl text-lg text-paper/85">{h.ctaBody}</p>
            </div>
            <div className="relative flex md:justify-end">
              <Link href={L("/donate")} className="btn bg-sun px-10 py-5 text-2xl text-ink shadow-xl hover:-translate-y-1 hover:shadow-2xl">{h.ctaButton}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
