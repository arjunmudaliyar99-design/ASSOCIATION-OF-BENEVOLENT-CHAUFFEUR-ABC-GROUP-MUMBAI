import type { Metadata } from "next";
import Photo from "@/components/Photo";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { objectives } from "@/data/site";

export const metadata: Metadata = { title: "Our work", description: "The seven areas of service of ABC Group Mumbai: jobs, welfare, education, ashrams, medical help, family welfare and social service." };

export default function Work() {
  return (
    <>
      <PageHero title="Our work" intro="The seven objectives of the association, taken from its founding documents." photo="/photos/ashram-food-seva/05.jpg" />
      <div className="bg-paper">
        {objectives.map((o, i) => (
          <section key={o.slug} id={o.slug} className={`scroll-mt-24 ${i % 2 ? "bg-sun text-on-sun" : ""}`}>
            <div className="wrap grid items-center gap-10 py-16 md:grid-cols-2">
              <Reveal className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${i % 2 ? "md:order-2 shadow-[-12px_12px_0_rgb(var(--navy))]" : "shadow-[12px_12px_0_rgb(var(--gold))]"}`}>
                <Photo src={o.photo} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
              </Reveal>
              <Reveal delay={0.1} className="grid gap-4">
                <span className="font-display text-7xl font-extrabold leading-none text-sindoor/80">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-4xl font-extrabold leading-tight">{o.title}</h2>
                <p className="max-w-lg text-lg leading-relaxed opacity-90">{o.body}</p>
                <Link href={`/donate?cause=${["education", "ashram", "medical", "welfare"].includes(o.slug) ? o.slug : "general"}`} className="btn-red w-max">Support this work</Link>
              </Reveal>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
