import PageHero from "@/components/PageHero";
import { site } from "@/data/site";

export default function Policy({ title, sections }: { title: string; sections: { h: string; p: string[] }[] }) {
  return (
    <>
      <PageHero title={title} intro={`Last updated 14 November 2026. Applies to ${site.url.replace("https://", "")}.`} />
      <article className="bg-paper">
        <div className="wrap grid max-w-3xl gap-8 py-16 text-lg leading-relaxed">
          {sections.map((s) => (
            <section key={s.h} className="grid gap-3">
              <h2 className="font-display text-2xl font-extrabold">{s.h}</h2>
              {s.p.map((t, i) => <p key={i}>{t}</p>)}
            </section>
          ))}
          <p className="border-t-2 border-line pt-6 text-muted">Questions? Write to {site.email} or call {site.phone}. {site.fullName}, {site.address}.</p>
        </div>
      </article>
    </>
  );
}
