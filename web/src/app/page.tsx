import Link from "next/link";
import Photo from "@/components/Photo";
import HeroStack from "@/components/HeroStack";
import { CountUp, Reveal } from "@/components/Motion";
import { objectives, site } from "@/data/site";
import { albums } from "@/data/gallery";

export default function Home() {
  const strip = albums.flatMap((a) => a.photos.slice(0, 3)).slice(0, 10);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sun text-on-sun">
        <div className="wrap grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:pt-20">
          <div className="grid gap-6">
            <p className="w-max rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-gold">Registered public trust · {site.regNo}</p>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-extrabold leading-[.95] tracking-tight">
              Mumbai&apos;s drivers, looking after Mumbai.
            </h1>
            <p className="max-w-xl text-xl leading-relaxed opacity-90">
              ABC Group Mumbai is a family of chauffeurs who find each other work without commission, stand by each other in emergencies, and feed and teach children who need it.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/donate" className="btn-red animate-beat">Donate any amount</Link>
              <Link href="/our-work" className="btn-ghost">See our work</Link>
            </div>
          </div>
          <HeroStack />
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-4 bg-navy"><div className="lane mt-1.5 h-1 animate-drive" /></div>
      </section>

      {/* Moving motto band */}
      <div className="overflow-hidden bg-navy py-4 text-gold" aria-hidden>
        <div className="flex w-max animate-marquee gap-10 font-display text-2xl font-bold">
          {[...Array(2)].flatMap((_, k) => ["To serve", "★", "To care", "★", "To uplift", "★", "Social service", "★", "Medical help", "★", "Ashram seva", "★", "Zero commission", "★"].map((t, i) => <span key={`${k}-${i}`}>{t}</span>))}
        </div>
      </div>

      {/* Facts */}
      <section className="bg-paper">
        <div className="wrap grid grid-cols-2 gap-px overflow-hidden py-14 md:grid-cols-4">
          {[
            { n: <>2023</>, l: "Serving since" },
            { n: <>₹<CountUp to={0} /></>, l: "Commission on driving jobs" },
            { n: <CountUp to={7} />, l: "Areas of service" },
            { n: <CountUp to={albums.length} />, l: "Service drives on camera" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08} className="grid gap-1 border-l-4 border-gold px-5 py-2">
              <span className="font-display text-5xl font-extrabold text-ink">{s.n}</span>
              <span className="text-muted">{s.l}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Work */}
      <section className="bg-sun text-on-sun">
        <div className="wrap grid gap-10 py-20">
          <Reveal className="grid max-w-2xl gap-3">
            <h2 className="h-sec">Seven ways we show up</h2>
            <p className="text-lg opacity-90">Everything ABC does comes from one idea: no driver, and no driver&apos;s family, should face a hard time alone.</p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {objectives.map((o, i) => (
              <Reveal key={o.slug} delay={(i % 3) * 0.08} className={i === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""}>
                <Link href={`/our-work#${o.slug}`} className="group relative block h-full min-h-[260px] overflow-hidden rounded-3xl bg-navy text-white">
                  <Photo src={o.photo} alt="" fill sizes="(min-width:1024px) 40vw, (min-width:640px) 50vw, 100vw" className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end gap-2 p-6">
                    <h3 className={`font-extrabold leading-tight text-gold ${i === 0 ? "text-4xl" : "text-2xl"}`}>{o.title}</h3>
                    <p className="max-w-md text-white/90">{o.body}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photo strip */}
      <section className="bg-paper py-20">
        <div className="wrap mb-8 flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className="h-sec">From our drives</h2></Reveal>
          <Link href="/gallery" className="btn-ghost">Open the gallery</Link>
        </div>
        <div className="flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:px-6 [scrollbar-width:thin]">
          {strip.map((p, i) => (
            <div key={p.src} className={`relative h-72 shrink-0 snap-start overflow-hidden rounded-2xl ${i % 2 ? "mt-8" : ""}`} style={{ width: `${Math.round((288 * p.w) / p.h)}px`, maxWidth: "80vw" }}>
              <Photo src={p.src} alt="ABC members at a service drive" fill sizes="400px" className="object-cover transition duration-500 hover:scale-105" />
            </div>
          ))}
        </div>
      </section>

      {/* Donate CTA */}
      <section className="bg-navy text-[#FFF3CD]">
        <div className="wrap grid items-center gap-8 py-20 md:grid-cols-[1.4fr_1fr]">
          <Reveal className="grid gap-4">
            <h2 className="h-sec text-gold">Every rupee goes on the road to someone who needs it.</h2>
            <p className="max-w-xl text-lg opacity-90">Give whatever you can. Pay by UPI, card or netbanking through Razorpay, and get a receipt by email.</p>
          </Reveal>
          <Reveal delay={0.1} className="flex md:justify-end">
            <Link href="/donate" className="btn bg-gold px-10 py-5 text-2xl text-navy shadow-[0_6px_0_rgb(var(--sindoor))] hover:-translate-y-1">Donate now</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
