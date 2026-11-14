"use client";
import { useActionState } from "react";
import { recordOfflineRenewal, updateMember, uploadDoc } from "@/app/admin/actions";
import { input } from "@/components/admin/ui";
import type { Dict } from "@/i18n/en";

type A = Dict["admin"];

const box = "grid content-start gap-4 rounded-3xl bg-card p-6 ring-1 ring-line";
const lab = "grid gap-1 text-sm font-semibold";

export function MemberEdit({ m, t, licenceLabel }: { m: Record<string, string | number>; t: A; licenceLabel: string }) {
  const [msg, run, pending] = useActionState(updateMember, undefined);
  return (
    <form action={run} className={box}>
      <h2 className="font-display text-2xl font-extrabold">{t.details}</h2>
      <input type="hidden" name="id" value={m.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lab}>{t.th.name}<input name="name" defaultValue={m.name} required className={input} /></label>
        <label className={lab}>{t.th.mobile}<input value={m.phone} readOnly className={`${input} opacity-70`} /></label>
        <label className={lab}>{licenceLabel}<input name="licence_no" defaultValue={m.licence_no} className={input} /></label>
        <label className={lab}>{t.th.pan}<input name="pan" defaultValue={m.pan} maxLength={10} className={`${input} uppercase`} /></label>
        <label className={lab}>Email<input name="email" type="email" defaultValue={m.email} className={input} /></label>
        <label className={lab}>Area<input name="area" defaultValue={m.area} className={input} /></label>
        <label className={lab}>{t.th.validUntil}<input name="expires_on" type="date" defaultValue={m.expires_on} required className={input} /></label>
      </div>
      <label className={lab}>{t.notes}<textarea name="notes" defaultValue={m.notes} rows={3} className={input} /></label>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-primary !px-6 !py-2.5 !text-base disabled:opacity-60">{t.save}</button>{msg && <span role="status" className="font-semibold">{msg}</span>}</div>
    </form>
  );
}

export function OfflineRenewal({ id, plans, t }: { id: number; plans: { id: string; label: string; price: number }[]; t: A }) {
  const [msg, run, pending] = useActionState(recordOfflineRenewal, undefined);
  return (
    <form action={run} className={box}>
      <h2 className="font-display text-2xl font-extrabold">{t.renewTitle}</h2>
      <p className="text-ink/70">{t.renewBody}</p>
      <input type="hidden" name="id" value={id} />
      <label className={lab}>{t.th.plan}<select name="planId" className={input}>{plans.map((p) => <option key={p.id} value={p.id}>{p.label} (₹{p.price.toLocaleString("en-IN")})</option>)}</select></label>
      <label className={lab}>{t.amountReceived}<input name="amount" type="number" min={0} step="1" defaultValue={plans[0]?.price} required className={input} /></label>
      <label className={lab}>{t.paidBy}<select name="mode" className={input}><option value="cash">{t.cash}</option><option value="upi">{t.upi}</option><option value="bank">{t.bank}</option></select></label>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-primary !px-6 !py-2.5 !text-base disabled:opacity-60">{t.recordRenewal}</button>{msg && <span role="status" className="font-semibold">{msg}</span>}</div>
    </form>
  );
}

export function DocUpload({ id, t, kinds }: { id: number; t: A; kinds: Record<string, string> }) {
  const [msg, run, pending] = useActionState(uploadDoc, undefined);
  return (
    <form action={run} className={box}>
      <h2 className="font-display text-xl font-extrabold">{t.addDoc}</h2>
      <p className="text-ink/70">{t.addDocBody}</p>
      <input type="hidden" name="id" value={id} />
      <label className={lab}>{t.document}<select name="kind" className={input}>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label className={lab}>{t.file}<input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className={input} /></label>
      <div className="flex items-center gap-3"><button disabled={pending} className="btn-primary !px-6 !py-2.5 !text-base disabled:opacity-60">{t.upload}</button>{msg && <span role="status" className="font-semibold">{msg}</span>}</div>
    </form>
  );
}
