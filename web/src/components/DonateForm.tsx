"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { causes, features } from "@/data/site";
import { errorText, pay, preloadCheckout } from "@/lib/checkout";
import { href, isLang } from "@/i18n/config";
import type { Dict } from "@/i18n/en";

export default function DonateForm({ t }: { t: { donate: Dict["donate"]; common: Dict["common"]; errors: Dict["errors"] } }) {
  const d = t.donate;
  const params = useSearchParams();
  const lang = typeof document !== "undefined" && isLang(document.documentElement.lang) ? document.documentElement.lang : "en";
  const router = useRouter();
  const [amount, setAmount] = useState(params.get("amount")?.replace(/[^\d.]/g, "") ?? "");
  const [cause, setCause] = useState(causes.some((c) => c.id === params.get("cause")) ? params.get("cause")! : "general");
  const [f, setF] = useState({ name: "", email: "", phone: "", pan: "" });
  const [wants80g, setWants80g] = useState(features.has80G);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const rupees = Number(amount);
  const shown = rupees > 0 ? `₹${rupees.toLocaleString("en-IN")}` : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!(rupees >= 1)) return setErr(d.needAmount);
    if (wants80g && !/^[A-Z]{5}\d{4}[A-Z]$/.test(f.pan)) return setErr(d.badPan);
    setBusy(true);
    try {
      const r = await pay({
        endpoint: "/api/donate/order",
        body: { amount: rupees, cause, ...f, pan: wants80g ? f.pan : "" },
        description: d.causes[cause as keyof typeof d.causes] ?? d.button,
        prefill: { name: f.name, email: f.email, contact: f.phone },
      });
      if (r.dismissed) return setBusy(false);
      router.push(`${href(lang, "/donate/thank-you")}?id=${encodeURIComponent(r.paymentId)}&ok=${r.ok ? 1 : 0}`);
    } catch (x) {
      setErr(errorText(x, t.errors, {}, t.common.error));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} onFocus={() => void preloadCheckout()} noValidate className="grid gap-6 rounded-3xl bg-card p-6 text-ink shadow-[0_10px_0_rgb(var(--navy))] sm:p-8">
      <label htmlFor="amount" className="grid gap-2">
        <span className="font-display text-xl font-bold">{d.amount}</span>
        <span className="flex items-center rounded-2xl border-2 border-line bg-paper px-4 focus-within:border-ink">
          <span aria-hidden className="font-display text-4xl font-extrabold text-muted">₹</span>
          <input id="amount" inputMode="decimal" autoComplete="off" placeholder={d.anyAmount} value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
            className="w-full bg-transparent px-2 py-3 font-display text-4xl font-extrabold tabular-nums placeholder:text-muted/50 focus:outline-none" />
        </span>
      </label>

      <fieldset className="grid gap-2">
        <legend className="mb-2 font-display text-xl font-bold">{d.cause}</legend>
        <div className="flex flex-wrap gap-2">
          {causes.map((c) => (
            <button type="button" key={c.id} onClick={() => setCause(c.id)} aria-pressed={cause === c.id}
              className={`relative rounded-full border-2 px-4 py-2 font-semibold transition ${cause === c.id ? "border-navy text-gold" : "border-line hover:border-ink"}`}>
              {cause === c.id && <motion.span layoutId="cause" className="absolute inset-0 -z-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 300, damping: 28 }} />}
              <span className="relative">{d.causes[c.id as keyof typeof d.causes] ?? c.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="name" className="grid gap-1.5 sm:col-span-2"><span className="font-semibold">{d.name}</span>
          <input id="name" autoComplete="name" required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label htmlFor="email" className="grid gap-1.5"><span className="font-semibold">{d.email} <span className="font-normal text-muted">{d.emailHint}</span></span>
          <input id="email" type="email" autoComplete="email" required className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label htmlFor="phone" className="grid gap-1.5"><span className="font-semibold">{d.phone} <span className="font-normal text-muted">{d.optional}</span></span>
          <input id="phone" type="tel" autoComplete="tel" className="field" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      </div>

      {features.has80G && <div className="grid gap-3 rounded-2xl bg-sun/40 p-4">
        <label htmlFor="g80" className="flex cursor-pointer items-start gap-3">
          <input id="g80" type="checkbox" checked={wants80g} onChange={(e) => setWants80g(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--ink))]" />
          <span><span className="font-semibold">{d.want80g}</span><span className="block text-sm text-ink/70">{d.want80gHint}</span></span>
        </label>
        {wants80g && (
          <label htmlFor="pan" className="grid gap-1.5"><span className="font-semibold">{d.pan} <span className="font-normal text-ink/70">{d.panHint}</span></span>
            <input id="pan" autoComplete="off" maxLength={10} placeholder="ABCDE1234F" className="field uppercase tracking-widest" value={f.pan}
              onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></label>
        )}
      </div>}

      <AnimatePresence>
        {err && <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</motion.p>}
      </AnimatePresence>

      <button disabled={busy} className="btn-red w-full py-4 text-xl disabled:opacity-60">
        {busy ? t.common.opening : shown ? d.buttonAmount.replace("{amount}", shown) : d.button}
      </button>
      <p className="text-center text-sm text-muted">{d.neverSee}</p>
    </form>
  );
}
