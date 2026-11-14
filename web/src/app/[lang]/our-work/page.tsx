import Link from "next/link";
import Photo from "@/components/Photo";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { objectives } from "@/data/site";
import { pageCtx, pageMeta } from "@/i18n";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.work.title, description: t.work.intro }), "/our-work");

export default async function Work({ params }: { params: Promise<{ lang: string }> }) {
  const { t, L } = await pageCtx(params);
  return (
    <>
      <PageHero title={t.work.title} intro={t.work.intro} photo="/photos/ashram-food-seva/05.jpg" />
      <div className="bg-paper">
        {objectives.map((o, i) => {
          const ot = t.objectives[o.slug as keyof typeof t.objectives];
          const cause = ["education", "ashram", "medical", "welfare"].includes(o.slug) ? o.slug : "general";
          return (
            <section key={o.slug} id={o.slug} className={`scroll-mt-24 ${i % 2 ? "bg-sun" : ""}`}>
              <div className="wrap grid items-center gap-10 py-16 md:grid-cols-2">
                <Reveal className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${i % 2 ? "md:order-2 shadow-[-12px_12px_0_rgb(var(--navy))]" : "shadow-[12px_12px_0_rgb(var(--gold))]"}`}>
                  <Photo src={o.photo} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
                </Reveal>
                <Reveal delay={0.1} className="grid gap-4">
                  <span className="font-display text-7xl font-extrabold leading-none text-sindoor/80">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="font-display text-4xl font-extrabold leading-tight">{ot.title}</h2>
                  <p className="max-w-lg text-lg leading-relaxed opacity-90">{ot.body}</p>
                  <Link href={L(`/donate?cause=${cause}`)} className="btn-primary w-max">{t.work.support}</Link>
                </Reveal>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
