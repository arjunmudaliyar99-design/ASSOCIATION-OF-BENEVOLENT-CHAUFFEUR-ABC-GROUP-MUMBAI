"use client";
import { useActionState } from "react";
import { savePlan } from "@/app/admin/actions";
import { input } from "@/components/admin/ui";

type P = { id: string; label: string; months: number; price: number; active: boolean; sort: number };
const lab = "grid gap-1 text-sm font-semibold";

export default function PlanForm({ plan }: { plan?: P }) {
  const [msg, run, pending] = useActionState(savePlan, undefined);
  return (
    <form action={run} className="grid gap-4 rounded-3xl bg-card p-6 ring-1 ring-line">
      <h2 className="font-display text-xl font-extrabold">{plan ? plan.label : "Add a new plan"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lab}>Plan code{plan ? <><input value={plan.id} readOnly className={`${input} opacity-70`} /><input type="hidden" name="id" value={plan.id} /></> : <input name="id" placeholder="e.g. 2y" required className={input} />}</label>
        <label className={lab}>Name shown to drivers<input name="label" defaultValue={plan?.label} placeholder="2 years" required className={input} /></label>
        <label className={lab}>Length (months)<input name="months" type="number" min={1} max={120} defaultValue={plan?.months ?? 12} required className={input} /></label>
        <label className={lab}>Price (₹)<input name="price" type="number" min={1} step="1" defaultValue={plan?.price} required className={input} /></label>
        <label className={lab}>Order on page<input name="sort" type="number" min={0} max={99} defaultValue={plan?.sort ?? 5} className={input} /></label>
        <label className="flex items-center gap-2 self-end pb-2 font-semibold"><input name="active" type="checkbox" defaultChecked={plan?.active ?? true} className="h-5 w-5 accent-[rgb(var(--ink))]" />Show on Join page</label>
      </div>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-primary !px-6 !py-2.5 !text-base disabled:opacity-60">{plan ? "Save" : "Add plan"}</button>{msg && <span role="status" className="font-semibold">{msg}</span>}</div>
    </form>
  );
}
