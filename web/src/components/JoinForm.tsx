"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { errorText, pay, preloadCheckout } from "@/lib/checkout";
import { href, isLang } from "@/i18n/config";
import type { Dict } from "@/i18n/en";
import DocInput from "@/components/DocInput";

type Plan = { id: string; label: string; months: number; price_paise: number };
const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export default function JoinForm({ plans, t }: { plans: Plan[]; t: { join: Dict["join"]; common: Dict["common"]; errors: Dict["errors"] } }) {
  const j = t.join;
  const lang = typeof document !== "undefined" && isLang(document.documentElement.lang) ? document.documentElement.lang : "en";
  const planName = (p: Plan) => j.plans[p.id] ?? p.label;
  const docNames = { aadhaar: j.aadhaar, pan: j.panCard, licence: j.licenceCard };
  const docT = { frontSide: j.frontSide, photoOrPdf: j.photoOrPdf, preparing: j.preparing, added: j.added, tapChange: j.tapChange, tooBigPdf: j.docTooBigPdf, wrongType: j.docWrongType, unreadable: j.docUnreadable };
  const router = useRouter();
  const params = useSearchParams();
  const [planId, setPlanId] = useState(plans[0].id);
  const [f, setF] = useState({ name: "", phone: params.get("phone") ?? "", licence_no: "", pan: "", email: "", area: "" });
  const [agree, setAgree] = useState(false);
  const [docs, setDocs] = useState<{ aadhaar?: string; pan?: string; licence?: string }>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const plan = plans.find((p) => p.id === planId)!;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: k === "pan" ? e.target.value.toUpperCase() : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!agree) return setErr(j.needAgree);
    setBusy(true);
    try {
      const r = await pay({ endpoint: "/api/join/order", body: { planId, ...f, docs }, description: planName(plan), prefill: { name: f.name, email: f.email, contact: f.phone } });
      if (r.dismissed) return setBusy(false);
      if (r.ok && r.token) router.push(`${href(lang, `/membership/${r.token}`)}?new=1`);
      else router.push(`${href(lang, "/donate/thank-you")}?id=${encodeURIComponent(r.paymentId)}&ok=0`);
    } catch (x) {
      setErr(errorText(x, t.errors, docNames, t.common.error));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} onFocus={() => void preloadCheckout()} noValidate className="grid gap-6 rounded-[2rem] bg-card p-6 shadow-[0_30px_70px_-30px_rgb(var(--ink)/.45)] ring-1 ring-line sm:p-8">
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-display text-xl font-bold">{j.choosePlan}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <button type="button" key={p.id} onClick={() => setPlanId(p.id)} aria-pressed={planId === p.id}
              className={`relative grid gap-1 rounded-2xl border-2 p-5 text-left transition duration-300 ${planId === p.id ? "border-ink bg-sun" : "border-line bg-paper hover:border-ink/50"}`}>
              <span className="font-display text-lg font-bold">{planName(p)}</span>
              <span className="font-display text-4xl font-extrabold">{inr(p.price_paise)}</span>
              <span className="text-sm text-ink/70">{j.perDay.replace("{n}", (p.price_paise / 100 / (p.months * 30.4)).toFixed(1))}</span>
              {planId === p.id && <motion.span layoutId="plan-tick" className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-ink text-sun">✓</motion.span>}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["name", j.name, "name", "text", true],
          ["phone", j.mobile, "tel", "tel", true],
          ["licence_no", j.licence, "off", "text", true],
          ["pan", j.pan, "off", "text", false],
          ["email", j.email, "email", "email", false],
          ["area", j.area, "address-level2", "text", false],
        ] as const).map(([k, label, ac, type, req]) => (
          <label key={k} htmlFor={`j-${k}`} className="grid gap-1.5">
            <span className="font-semibold">{label}</span>
            <input id={`j-${k}`} type={type} autoComplete={ac} required={req} value={f[k]} onChange={set(k)} maxLength={k === "pan" ? 10 : 80}
              inputMode={k === "phone" ? "numeric" : undefined} className={`field ${k === "pan" ? "uppercase tracking-widest" : ""}`} />
          </label>
        ))}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-display text-xl font-bold">{j.docsTitle}</legend>
        <p className="text-sm text-ink/70">{j.docsBody}</p>
        <DocInput id="d-aadhaar" label={j.aadhaar} hint={j.frontSide} t={docT} value={docs.aadhaar} onChange={(v, e) => { setDocs({ ...docs, aadhaar: v }); setErr(e ?? ""); }} />
        <DocInput id="d-pan" label={j.panCard} t={docT} value={docs.pan} onChange={(v, e) => { setDocs({ ...docs, pan: v }); setErr(e ?? ""); }} />
        <DocInput id="d-licence" label={j.licenceCard} hint={j.frontSide} t={docT} value={docs.licence} onChange={(v, e) => { setDocs({ ...docs, licence: v }); setErr(e ?? ""); }} />
      </fieldset>

      <label htmlFor="j-agree" className="flex cursor-pointer items-start gap-3">
        <input id="j-agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--ink))]" />
        <span className="text-ink/80">{j.agree}</span>
      </label>

      <AnimatePresence>
        {err && <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</motion.p>}
      </AnimatePresence>

      <button disabled={busy} className="btn-primary w-full py-4 text-xl disabled:opacity-60">{busy ? t.common.opening : j.pay.replace("{amount}", inr(plan.price_paise))}</button>
      <p className="text-center text-sm text-ink/60">{t.common.secure}</p>
    </form>
  );
}
