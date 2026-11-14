import Link from "next/link";
import Aurora from "@/components/Aurora";
import Photo from "@/components/Photo";
import Slider from "@/components/Slider";
import PhotoMarquee from "@/components/PhotoMarquee";
import { CountUp, Reveal } from "@/components/Motion";
import { features, jobNetwork, objectives, site } from "@/data/site";
import { albums } from "@/data/gallery";

const heroSlides = [
  { src: "/photos/drivers-felicitation-bus-event/02.jpg", caption: "Honouring our drivers" },
  { src: "/photos/ashram-food-seva/03.jpg", caption: "Meals at the ashram" },
  { src: "/photos/childrens-home-visit/07.jpg", caption: "Children's home visit" },
  { src: "/photos/grocery-supplies-drive/01.jpg", caption: "Grocery and supplies drive" },
  { src: "/photos/ashram-food-seva/13.jpg", caption: "Serving food with care" },
];

export default function Home() {
  const all = albums.flatMap((a) => a.photos);
  const rows: [typeof all, typeof all] = [all.filter((_, i) => i % 2 === 0).slice(0, 14), all.filter((_, i) => i % 2 === 1).slice(0, 14)];
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sun">
        <Aurora />
        <div className="wrap relative grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pb-28 lg:pt-16">
          <div className="grid gap-7">
            <p className="glass animate-rise w-max rounded-full px-4 py-2 text-sm font-semibold" style={{ animationDelay: "0ms" }}>
              Registered public trust · Reg. No. {site.regNo}
            </p>
            <h1 className="font-display text-[clamp(3rem,7.5vw,6.5rem)] font-extrabold leading-[.92] tracking-tight">
              {["To serve.", "To care.", "To uplift."].map((w, i) => (
                <span key={w} className="block overflow-hidden pb-1"><span className="block animate-wordup" style={{ animationDelay: `${120 + i * 140}ms` }}>{w}</span></span>
              ))}
            </h1>
            <p className="animate-rise max-w-xl text-xl leading-relaxed text-ink/80" style={{ animationDelay: "520ms" }}>
              The Association of Benevolent Chauffeur, Group Mumbai. We help drivers find work without commission, support their families in hard times, and serve ashrams and children in need.
            </p>
            <div className="animate-rise flex flex-wrap gap-4" style={{ animationDelay: "620ms" }}>
              <Link href="/donate" className="btn-primary">Donate to the trust</Link>
              <Link href="/our-work" className="btn-ghost glass">Our work</Link>
            </div>
          </div>
          <div className="animate-rise relative h-[22rem] sm:h-[30rem] lg:h-[36rem]" style={{ animationDelay: "300ms" }}>
            <Slider slides={heroSlides} className="h-full [&>div]:h-full" sizes="(min-width:1024px) 55vw, 100vw" priority />
            <div className="glass absolute -left-4 top-10 hidden animate-float rounded-2xl px-5 py-3 sm:block lg:-left-10">
              <p className="font-display text-3xl font-extrabold leading-none">₹0</p>
              <p className="text-sm font-semibold text-ink/75">commission on jobs</p>
            </div>
            <div className="glass absolute -right-4 bottom-24 hidden animate-float lg:-right-8 rounded-2xl px-5 py-3 [animation-delay:-3s] sm:block">
              <p className="font-display text-3xl font-extrabold leading-none">{jobNetwork.members}</p>
              <p className="text-sm font-semibold text-ink/75">drivers in our network</p>
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
            { n: "2023", l: "Year registered" },
            { n: <>₹<CountUp to={0} /></>, l: "Commission charged on jobs" },
            { n: <CountUp to={7} />, l: "Areas of social service" },
            { n: jobNetwork.members, l: "Drivers in our job network" },
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
              <h2 className="h-sec">What we do</h2>
              <p className="text-lg text-ink/75">Seven objectives guide every activity of the association, from finding drivers fair work to feeding children at ashrams.</p>
            </div>
            <Link href="/our-work" className="btn-ghost">See all our work</Link>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {objectives.map((o, i) => (
              <Reveal key={o.slug} delay={(i % 4) * 0.07} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
                <Link href={`/our-work#${o.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card shadow-[0_20px_50px_-30px_rgb(var(--ink)/.5)] ring-1 ring-line transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-28px_rgb(var(--ink)/.55)]">
                  <div className={`relative overflow-hidden ${i === 0 ? "aspect-[16/10] lg:flex-1" : "aspect-[4/3]"}`}>
                    <Photo src={o.photo} alt="" fill sizes="(min-width:1024px) 50vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-110" />
                    <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-sun font-display text-lg font-extrabold shadow">{i + 1}</span>
                  </div>
                  <div className="grid gap-2 p-6">
                    <h3 className={`font-extrabold leading-tight ${i === 0 ? "text-3xl" : "text-xl"}`}>{o.title}</h3>
                    <p className="text-ink/75">{o.body}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Job network */}
      <section className="glow">
        <div className="wrap grid items-center gap-10 py-20 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="grid gap-5">
            <h2 className="h-sec">{jobNetwork.members} drivers, one network</h2>
            <p className="max-w-xl text-lg text-ink/80">Our members share driving jobs with each other in a WhatsApp group, without charging any commission. Pick a plan, pay online, and the association adds you after checking your details.</p>
            <Link href="/join" className="btn-primary w-max">Join the network</Link>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_70px_-25px_rgb(var(--ink)/.5)]">
            <Photo src="/photos/drivers-felicitation-bus-event/01.jpg" alt="ABC member drivers together" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Photo marquee */}
      <section className="overflow-hidden bg-paper py-20 lg:py-28">
        <div className="wrap mb-10 flex flex-wrap items-end justify-between gap-4">
          <Reveal><h2 className="h-sec">Moments from our drives</h2></Reveal>
          <Link href="/gallery" className="btn-ghost">Open the gallery</Link>
        </div>
        <PhotoMarquee rows={rows} />
      </section>

      {/* Donate CTA */}
      <section className="bg-sun">
        <div className="wrap py-16">
          <Reveal className="relative grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-ink p-10 text-paper md:grid-cols-[1.5fr_1fr] md:p-16">
            <div aria-hidden className="absolute -right-20 -top-20 h-80 w-80 animate-spin-slow rounded-full border-[36px] border-sun/20" />
            <div className="relative grid gap-4">
              <h2 className="h-sec text-sun">Support the work of {site.name}</h2>
              <p className="max-w-xl text-lg text-paper/85">Give any amount.{features.has80G && " Donations qualify for tax deduction under Section 80G."} Pay safely by UPI, card or netbanking through Razorpay.</p>
            </div>
            <div className="relative flex md:justify-end">
              <Link href="/donate" className="btn bg-sun px-10 py-5 text-2xl text-ink shadow-xl hover:-translate-y-1 hover:shadow-2xl">Donate now</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
