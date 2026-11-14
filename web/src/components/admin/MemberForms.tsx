"use client";
import { useActionState } from "react";
import { recordOfflineRenewal, updateMember } from "@/app/admin/actions";
import { input } from "@/components/admin/ui";

const box = "grid content-start gap-4 rounded-3xl bg-card p-6 ring-1 ring-line";
const lab = "grid gap-1 text-sm font-semibold";

export function MemberEdit({ m }: { m: Record<string, string | number> }) {
  const [msg, run, pending] = useActionState(updateMember, undefined);
  return (
    <form action={run} className={box}>
      <h2 className="font-display text-2xl font-extrabold">Details</h2>
      <input type="hidden" name="id" value={m.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lab}>Full name<input name="name" defaultValue={m.name} required className={input} /></label>
        <label className={lab}>Mobile<input value={m.phone} readOnly className={`${input} opacity-70`} /></label>
        <label className={lab}>Licence number<input name="licence_no" defaultValue={m.licence_no} className={input} /></label>
        <label className={lab}>PAN<input name="pan" defaultValue={m.pan} maxLength={10} className={`${input} uppercase`} /></label>
        <label className={lab}>Email<input name="email" type="email" defaultValue={m.email} className={input} /></label>
        <label className={lab}>Area<input name="area" defaultValue={m.area} className={input} /></label>
        <label className={lab}>Valid until<input name="expires_on" type="date" defaultValue={m.expires_on} required className={input} /></label>
      </div>
      <label className={lab}>Notes (only admins see this)<textarea name="notes" defaultValue={m.notes} rows={3} className={input} /></label>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-primary !px-6 !py-2.5 !text-base disabled:opacity-60">Save changes</button>{msg && <span role="status" className="font-semibold">{msg}</span>}</div>
    </form>
  );
}

export function OfflineRenewal({ id, plans }: { id: number; plans: { id: string; label: string; price: number }[] }) {
  const [msg, run, pending] = useActionState(recordOfflineRenewal, undefined);
  return (
    <form action={run} className={box}>
      <h2 className="font-display text-2xl font-extrabold">Record a renewal paid in cash or UPI</h2>
      <p className="text-ink/70">Use this when the member paid the association directly. The new period starts after the current expiry date.</p>
      <input type="hidden" name="id" value={id} />
      <label className={lab}>Plan<select name="planId" className={input}>{plans.map((p) => <option key={p.id} value={p.id}>{p.label} (₹{p.price.toLocaleString("en-IN")})</option>)}</select></label>
      <label className={lab}>Amount received (₹)<input name="amount" type="number" min={0} step="1" defaultValue={plans[0]?.price} required className={input} /></label>
      <label className={lab}>Paid by<select name="mode" className={input}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank transfer</option></select></label>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-primary !px-6 !py-2.5 !text-base disabled:opacity-60">Record renewal</button>{msg && <span role="status" className="font-semibold">{msg}</span>}</div>
    </form>
  );
}
