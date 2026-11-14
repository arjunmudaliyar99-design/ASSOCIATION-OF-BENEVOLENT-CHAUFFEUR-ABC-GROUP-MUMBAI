import Link from "next/link";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";
import { pageCtx, pageMeta } from "@/i18n";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.benefits.title, description: t.benefits.intro }), "/member-benefits");

export default async function Benefits({ params }: { params: Promise<{ lang: string }> }) {
  const { t, L } = await pageCtx(params);
  const b = t.benefits;
  const cards = [
    { title: b.nativeTitle, body: b.nativeBody, amount: "₹15,000 – ₹20,000", repay: b.nativeRepay, days: "90" },
    { title: b.mumbaiTitle, body: b.mumbaiBody, amount: "₹5,000 – ₹10,000", repay: b.mumbaiRepay, days: "60" },
  ];
  return (
    <>
      <PageHero title={b.title} intro={b.intro} />
      <section className="bg-paper">
        <div className="wrap grid gap-8 py-16 lg:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} className="relative grid content-start gap-5 overflow-hidden rounded-[2rem] bg-card p-8 ring-1 ring-line shadow-[0_30px_70px_-35px_rgb(var(--ink)/.5)]">
              <span aria-hidden className="absolute -right-6 -top-10 font-display text-[9rem] font-extrabold leading-none text-sun/50">{c.days}</span>
              <h2 className="relative font-display text-3xl font-extrabold leading-tight">{c.title}</h2>
              <p className="relative w-max rounded-full bg-ink px-5 py-2 font-display text-2xl font-extrabold text-sun">{c.amount}</p>
              <p className="relative text-lg leading-relaxed">{c.body}</p>
              <p className="relative rounded-2xl bg-sun/50 p-4 font-semibold">{c.repay}</p>
            </Reveal>
          ))}
        </div>
        <div className="wrap -mt-4 flex flex-wrap gap-3 pb-6">
          <span className="glass rounded-full px-5 py-2 font-semibold">✓ {b.noInterest}</span>
          <span className="glass rounded-full px-5 py-2 font-semibold">✓ {b.instalments}</span>
        </div>
      </section>
      <section className="bg-sun">
        <div className="wrap grid items-start gap-8 py-16 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="glass grid gap-4 rounded-[2rem] p-8">
            <h2 className="font-display text-3xl font-extrabold">{b.rulesTitle}</h2>
            <ol className="grid gap-3 text-lg">
              {b.rules.map((r, i) => (
                <li key={r} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-sun">{i + 1}</span>{r}</li>
              ))}
            </ol>
            <p className="pt-2 font-display font-bold text-ink/80">— {b.signed}</p>
          </Reveal>
          <Reveal delay={0.1}><Link href={L("/join")} className="btn-primary w-full py-5 text-2xl">{b.joinCta}</Link></Reveal>
        </div>
      </section>
    </>
  );
}
