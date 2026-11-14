import type { Metadata } from "next";
import Photo from "@/components/Photo";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "About us", description: "Who ABC Group Mumbai are: a registered association of Mumbai chauffeurs serving drivers, their families and children in need." };

export default function About() {
  return (
    <>
      <PageHero title="Drivers who stop for each other" intro="ABC Group Mumbai began with a simple promise between chauffeurs: when one of us is in trouble, the rest of us show up." />
      <section className="bg-paper">
        <div className="wrap grid items-center gap-12 py-20 lg:grid-cols-2">
          <Reveal className="grid gap-5 text-lg leading-relaxed">
            <h2 className="h-sec">Our story</h2>
            <p>The Association of Benevolent Chauffeur Group Mumbai was formed on {site.founded} by drivers who saw colleagues struggle alone with unpaid salaries, sudden hospital bills and no help finding work.</p>
            <p>Today the association finds members driving jobs without taking any commission, steps in when a family faces an emergency, and takes food, groceries and school supplies to ashrams and children&apos;s homes across Mumbai.</p>
            <p>It is a registered public trust under the Maharashtra Public Trusts Act and a registered society, Reg. No. {site.regNo}.</p>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[12px_12px_0_rgb(var(--gold))]">
            <Photo src="/photos/drivers-felicitation-bus-event/07.jpg" alt="ABC members gathered in front of the association's bus" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>
      <section className="bg-sun text-on-sun">
        <div className="wrap grid gap-6 py-20 md:grid-cols-2">
          {[
            { h: "Our vision", p: "A supportive and caring community where every driver and their family is treated with dignity, care and respect, and gets help in difficult times." },
            { h: "Our mission", p: "To serve people beyond our profession: support drivers and their families, lift up underprivileged communities, and make a real difference in society." },
          ].map((b, i) => (
            <Reveal key={b.h} delay={i * 0.1} className="grid gap-3 rounded-3xl bg-card p-8 text-ink shadow-[0_8px_0_rgb(var(--navy))]">
              <h2 className="font-display text-3xl font-extrabold">{b.h}</h2>
              <p className="text-lg leading-relaxed">{b.p}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="bg-paper">
        <div className="wrap grid gap-6 py-20">
          <Reveal className="grid gap-3">
            <h2 className="h-sec">Committee</h2>
            <p className="max-w-2xl text-lg text-muted">Names and photos of the committee members will appear here once the association shares them.</p>
          </Reveal>
          <Link href="/contact" className="btn-ghost w-max">Get in touch with the committee</Link>
        </div>
      </section>
    </>
  );
}
