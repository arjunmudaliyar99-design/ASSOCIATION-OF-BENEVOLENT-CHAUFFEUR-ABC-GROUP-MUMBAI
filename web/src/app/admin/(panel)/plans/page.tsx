import { q } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import PlanForm from "@/components/admin/PlanForm";
import { adminDict } from "@/i18n";

export const metadata = { title: "Plans & prices" };

export default async function Plans() {
  const { t } = await adminDict();
  const a = t.admin;
  const plans = await q<{ id: string; label: string; months: number; price_paise: number; active: number; sort: number }>("SELECT * FROM plans ORDER BY sort, months");
  return (
    <>
      <PageTitle title={a.nav.plans} sub={a.plansSub} />
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => <PlanForm t={a} key={p.id} plan={{ id: p.id, label: p.label, months: Number(p.months), price: Number(p.price_paise) / 100, active: !!p.active, sort: Number(p.sort) }} />)}
        <PlanForm t={a} />
      </div>
    </>
  );
}
