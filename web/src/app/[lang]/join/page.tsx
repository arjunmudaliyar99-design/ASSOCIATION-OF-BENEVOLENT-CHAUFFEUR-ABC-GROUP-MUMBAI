import Link from "next/link";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import JoinForm from "@/components/JoinForm";
import { q } from "@/lib/db";
import { jobNetwork } from "@/data/site";
import { pageCtx, pageMeta } from "@/i18n";
import { fill } from "@/i18n/config";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.join.title, description: t.join.howTitle }), "/join");
export const dynamic = "force-dynamic";

export default async function Join({ params }: { params: Promise<{ lang: string }> }) {
  const plans = (await q<{ id: string; label: string; months: number; price_paise: number }>(
    "SELECT id, label, months, price_paise FROM plans WHERE active = 1 ORDER BY sort, months")).map((p) => ({ ...p, months: Number(p.months), price_paise: Number(p.price_paise) }));
  const { t, L } = await pageCtx(params);
  const j = t.join;
  return (
    <>
      <PageHero title={j.title} intro={fill(j.intro, { n: jobNetwork.members })} />
      <section className="bg-paper">
        <div className="wrap grid gap-12 py-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid content-start gap-6">
            <h2 className="font-display text-3xl font-extrabold">{j.howTitle}</h2>
            <ol className="grid gap-4">
              {j.steps.map(([h, p], i) => (
                <li key={h} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-sun">{i + 1}</span>
                  <span><b className="block text-lg">{h}</b><span className="text-ink/75">{p}</span></span>
                </li>
              ))}
            </ol>
            <p className="glass rounded-2xl p-4 text-ink/80">{j.already} <Link href={L("/membership")} className="font-semibold underline">{j.check}</Link></p>
            <Link href={L("/member-benefits")} className="btn-ghost w-max">{t.nav.benefits}</Link>
          </div>
          {plans.length ? <Suspense><JoinForm plans={plans} t={{ join: j, common: t.common, errors: t.errors }} /></Suspense> : <p className="rounded-3xl bg-card p-8">{j.soon}</p>}
        </div>
      </section>
    </>
  );
}
