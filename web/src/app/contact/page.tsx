import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Contact", description: "Contact ABC Group Mumbai in Santacruz (E), Mumbai by phone, WhatsApp, email or Instagram." };

export default function Contact() {
  const items = [
    { h: "Call", v: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    { h: "WhatsApp", v: "Message us on WhatsApp", href: `https://wa.me/${site.whatsapp}` },
    { h: "Email", v: site.email, href: `mailto:${site.email}` },
    { h: "Instagram", v: `@${site.instagram}`, href: `https://instagram.com/${site.instagram}` },
  ];
  return (
    <>
      <PageHero title="Get in touch" intro="Need help, want to join, or want to support a drive? Reach us any way you like." />
      <section className="bg-paper">
        <div className="wrap grid gap-10 py-20 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.h} delay={i * 0.06}>
                <a href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="group grid h-full gap-1 rounded-3xl border-2 border-line bg-card p-6 transition hover:-translate-y-1 hover:border-ink hover:shadow-[0_6px_0_rgb(var(--gold))]">
                  <span className="font-display text-2xl font-extrabold">{it.h}</span>
                  <span className="break-words text-muted group-hover:text-ink">{it.v}</span>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="grid content-start gap-4 rounded-3xl bg-sun p-8 text-on-sun">
            <h2 className="font-display text-3xl font-extrabold">Our office</h2>
            <p className="text-lg">{site.address}</p>
            <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-red w-max">Open in Google Maps</a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
