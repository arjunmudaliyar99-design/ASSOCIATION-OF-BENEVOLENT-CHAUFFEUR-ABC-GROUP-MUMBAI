"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMember } from "@/app/admin/actions";
import DocInput from "@/components/DocInput";
import { input } from "@/components/admin/ui";
import type { Dict } from "@/i18n/en";

const box = "grid content-start gap-5 rounded-3xl bg-card p-6 ring-1 ring-line sm:p-8";
const lab = "grid gap-1 text-sm font-semibold";

/** Admin onboards a member directly: details + documents, no online payment. */
export default function AddMemberForm({ defaultValidUntil, t }: { defaultValidUntil: string; t: { admin: Dict["admin"]; join: Dict["join"] } }) {
  const a = t.admin, j = t.join;
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", email: "", area: "", expires_on: defaultValidUntil, amount: "", payment_mode: "", paid_on: "", reference: "" });
  const [docs, setDocs] = useState<Record<string, string | undefined>>({});
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const docT = { frontSide: j.frontSide, photoOrPdf: j.photoOrPdf, preparing: j.preparing, added: j.added, tapChange: j.tapChange, tooBigPdf: j.docTooBigPdf, wrongType: j.docWrongType, unreadable: j.docUnreadable };
  const cards = [["aadhaar", j.aadhaar], ["pan", j.panCard], ["licence", j.licenceCard]] as const;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    start(async () => {
      const r = await createMember({ ...f, docs });
      if ("error" in r) setErr(r.error);
      else router.push(`/admin/members/${r.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className={box}>
        <h2 className="font-display text-2xl font-extrabold">{a.details}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={lab}>{j.name}<input value={f.name} onChange={set("name")} required minLength={2} maxLength={80} autoComplete="off" className={input} /></label>
          <label className={lab}>{j.mobile}<input value={f.phone} onChange={set("phone")} required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="98XXXXXXXX" className={input} /></label>
          <label className={lab}>{j.email}<input type="email" value={f.email} onChange={set("email")} maxLength={120} className={input} /></label>
          <label className={lab}>{j.area}<input value={f.area} onChange={set("area")} maxLength={80} className={input} /></label>
          <label className={lab}>{a.th.validUntil}<input type="date" value={f.expires_on} onChange={set("expires_on")} required className={input} /></label>
        </div>
      </div>

      <div className={box}>
        <h2 className="font-display text-2xl font-extrabold">{a.payTitle}</h2>
        <p className="text-sm text-ink/70">{a.payHint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={lab}>{a.payAmount}<input type="number" min={0} step="1" inputMode="numeric" value={f.amount} onChange={set("amount")} placeholder="365" className={input} /></label>
          <label className={lab}>{a.payMode}
            <select value={f.payment_mode} onChange={set("payment_mode")} required={Number(f.amount) > 0} className={input}>
              <option value="">–</option>
              {(["cash", "upi", "bank", "cheque"] as const).map((m) => <option key={m} value={m}>{a.payModes[m]}</option>)}
            </select>
          </label>
          <label className={lab}>{a.payDate}<input type="date" value={f.paid_on} onChange={set("paid_on")} className={input} /></label>
          <label className={lab}>{a.payRef}<input value={f.reference} onChange={set("reference")} maxLength={60} className={input} /></label>
        </div>
      </div>

      <div className={box}>
        <h2 className="font-display text-2xl font-extrabold">{j.docsTitle}</h2>
        <p className="text-sm text-ink/70">{a.addMemberDocs}</p>
        {cards.map(([k, n]) => (
          <div key={k} className="grid gap-2">
            <p className="font-semibold">{n}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["front", "back"] as const).map((side) => {
                const key = `${k}_${side}`;
                return <DocInput key={key} id={`d-${key}`} label={`${n} – ${j[side]}`} hint={j.photoOrPdf} t={docT} value={docs[key]} onChange={(v, e) => { setDocs({ ...docs, [key]: v }); setErr(e ?? ""); }} />;
              })}
            </div>
          </div>
        ))}
      </div>

      {err && <p role="alert" className="rounded-2xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</p>}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-primary !px-8 !py-3 disabled:opacity-60">{pending ? a.saving : a.addMember}</button>
      </div>
    </form>
  );
}
