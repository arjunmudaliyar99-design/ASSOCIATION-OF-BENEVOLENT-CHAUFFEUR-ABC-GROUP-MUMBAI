import DonateForm from "@/components/DonateForm";
import { pageCtx, pageMeta } from "@/i18n";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.donate.title, description: t.donate.intro }), "/donate");

export default async function Donate({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ amount?: string; cause?: string }> }) {
  const sp = await searchParams;
  const { t } = await pageCtx(params);
  const d = t.donate;
  return (
    <section className="relative overflow-hidden bg-sun text-on-sun">
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="grid content-start gap-6">
          <h1 className="font-display text-[clamp(2.75rem,6vw,4.75rem)] font-extrabold leading-[.95]">{d.title}</h1>
          <p className="max-w-lg text-xl opacity-90">{d.intro}</p>
          <ul className="grid gap-3 text-lg">
            {[d.points[0], d.points[1], d.points[2], d.points[3]].map((p) => (
              <li key={p} className="flex items-start gap-3"><span aria-hidden className="mt-2 h-3 w-3 shrink-0 rotate-45 bg-sindoor" />{p}</li>
            ))}
          </ul>
        </div>
          <DonateForm initial={{ amount: sp.amount, cause: sp.cause }} t={{ donate: d, common: t.common, errors: t.errors }} />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-3 bg-navy"><div className="lane mt-1 h-1 animate-drive" /></div>
    </section>
  );
}
