import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import { Reveal } from "@/components/Motion";
import { jobNetwork, site } from "@/data/site";

export const metadata: Metadata = { title: "Contact", description: "Contact ABC Group Mumbai in Santacruz (E), Mumbai by phone, WhatsApp, email or Instagram, and ask about joining the drivers' job network." };

const icons: Record<string, string> = {
  Call: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  WhatsApp: "M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z",
  Email: "M4 4h16v16H4z M4 6l8 7 8-7",
  Instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z M17.5 6.5h0",
};

export default function Contact() {
  const items = [
    { h: "Call", v: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    { h: "WhatsApp", v: site.phone, href: `https://wa.me/${site.whatsapp}` },
    { h: "Email", v: site.email, href: `mailto:${site.email}` },
    { h: "Instagram", v: `@${site.instagram}`, href: `https://instagram.com/${site.instagram}` },
  ];
  return (
    <>
      <PageHero title="Contact us" intro="Need help, want to join, or want to support a drive? Reach us any way you like." photo="/photos/drivers-felicitation-bus-event/13.jpg" />
      <section className="bg-paper">
        <div className="wrap grid gap-8 py-20 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.h} delay={i * 0.06}>
                <a href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="group grid h-full gap-4 rounded-[1.75rem] bg-card p-7 ring-1 ring-line shadow-[0_20px_50px_-30px_rgb(var(--ink)/.5)] transition duration-300 hover:-translate-y-1 hover:bg-sun">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-sun text-ink transition group-hover:bg-ink group-hover:text-sun">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[it.h]} /></svg>
                  </span>
                  <span className="grid gap-1">
                    <span className="font-display text-2xl font-extrabold">{it.h}</span>
                    <span className="break-words text-ink/75">{it.v}</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="grid content-start gap-5 rounded-[1.75rem] bg-sun p-8 shadow-[0_20px_50px_-30px_rgb(var(--ink)/.5)]">
            <h2 className="font-display text-3xl font-extrabold">Our office</h2>
            <p className="text-lg">{site.address}</p>
            <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-max">Open in Google Maps</a>
          </Reveal>
        </div>
      </section>

      <section id="jobs" className="glow scroll-mt-24">
        <div className="wrap grid items-center gap-10 py-20 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="grid gap-5">
            <h2 className="h-sec">Join the drivers&apos; job network</h2>
            <p className="max-w-xl text-lg text-ink/80">{jobNetwork.note} The group has {jobNetwork.members} members. Jobs are shared without any commission.</p>
            <ul className="grid gap-3 text-lg">
              {["Joining has some requirements and a fee.", "Documents such as your PAN card are needed to join.", "Message us on WhatsApp and we'll explain the full process."].map((t) => (
                <li key={t} className="flex items-start gap-3"><span aria-hidden className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-ink" />{t}</li>
              ))}
            </ul>
            <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hello, I'd like to join the ABC drivers' job network.")}`} target="_blank" rel="noopener noreferrer" className="btn-ghost w-max">Ask on WhatsApp</a>
            <a href="/join" className="btn-primary w-max">Join online</a>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_70px_-25px_rgb(var(--ink)/.5)]">
            <Photo src="/photos/drivers-felicitation-bus-event/04.jpg" alt="Member drivers gathered together" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
