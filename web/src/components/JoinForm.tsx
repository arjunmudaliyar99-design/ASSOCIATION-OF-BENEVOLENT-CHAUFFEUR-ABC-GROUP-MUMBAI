"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { pay, preloadCheckout } from "@/lib/checkout";
import DocInput from "@/components/DocInput";

type Plan = { id: string; label: string; months: number; price_paise: number };
const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export default function JoinForm({ plans }: { plans: Plan[] }) {
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
    if (!agree) return setErr("Please confirm the details are correct.");
    setBusy(true);
    try {
      const r = await pay({ endpoint: "/api/join/order", body: { planId, ...f, docs }, description: `Membership – ${plan.label}`, prefill: { name: f.name, email: f.email, contact: f.phone } });
      if (r.dismissed) return setBusy(false);
      if (r.ok && r.token) router.push(`/membership/${r.token}?new=1`);
      else router.push(`/donate/thank-you?id=${encodeURIComponent(r.paymentId)}&ok=0`);
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} onFocus={() => void preloadCheckout()} noValidate className="grid gap-6 rounded-[2rem] bg-card p-6 shadow-[0_30px_70px_-30px_rgb(var(--ink)/.45)] ring-1 ring-line sm:p-8">
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-display text-xl font-bold">Choose a plan</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <button type="button" key={p.id} onClick={() => setPlanId(p.id)} aria-pressed={planId === p.id}
              className={`relative grid gap-1 rounded-2xl border-2 p-5 text-left transition duration-300 ${planId === p.id ? "border-ink bg-sun" : "border-line bg-paper hover:border-ink/50"}`}>
              <span className="font-display text-lg font-bold">{p.label}</span>
              <span className="font-display text-4xl font-extrabold">{inr(p.price_paise)}</span>
              <span className="text-sm text-ink/70">about ₹{(p.price_paise / 100 / (p.months * 30.4)).toFixed(1)} a day</span>
              {planId === p.id && <motion.span layoutId="plan-tick" className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-ink text-sun">✓</motion.span>}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["name", "Full name", "name", "text", true],
          ["phone", "Mobile number", "tel", "tel", true],
          ["licence_no", "Driving licence number", "off", "text", true],
          ["pan", "PAN number (optional)", "off", "text", false],
          ["email", "Email (optional)", "email", "email", false],
          ["area", "Area you live in (optional)", "address-level2", "text", false],
        ] as const).map(([k, label, ac, type, req]) => (
          <label key={k} htmlFor={`j-${k}`} className="grid gap-1.5">
            <span className="font-semibold">{label}</span>
            <input id={`j-${k}`} type={type} autoComplete={ac} required={req} value={f[k]} onChange={set(k)} maxLength={k === "pan" ? 10 : 80}
              inputMode={k === "phone" ? "numeric" : undefined} className={`field ${k === "pan" ? "uppercase tracking-widest" : ""}`} />
          </label>
        ))}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-display text-xl font-bold">Upload your documents</legend>
        <p className="text-sm text-ink/70">Take a clear photo of each card. Only the association&apos;s committee can see these, and they&apos;re used only to verify you. Already a member and renewing? You can skip this.</p>
        <DocInput id="d-aadhaar" label="Aadhaar card" hint="Front side, photo or PDF" value={docs.aadhaar} onChange={(v, e) => { setDocs({ ...docs, aadhaar: v }); setErr(e ?? ""); }} />
        <DocInput id="d-pan" label="PAN card" value={docs.pan} onChange={(v, e) => { setDocs({ ...docs, pan: v }); setErr(e ?? ""); }} />
        <DocInput id="d-licence" label="Driving licence" hint="Front side, photo or PDF" value={docs.licence} onChange={(v, e) => { setDocs({ ...docs, licence: v }); setErr(e ?? ""); }} />
      </fieldset>

      <label htmlFor="j-agree" className="flex cursor-pointer items-start gap-3">
        <input id="j-agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--ink))]" />
        <span className="text-ink/80">The details above are correct. I understand the association will check them before adding me to the group, and that membership fees are not refundable once I&apos;ve been added.</span>
      </label>

      <AnimatePresence>
        {err && <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</motion.p>}
      </AnimatePresence>

      <button disabled={busy} className="btn-primary w-full py-4 text-xl disabled:opacity-60">{busy ? "Opening secure payment…" : `Pay ${inr(plan.price_paise)} and join`}</button>
      <p className="text-center text-sm text-ink/60">Secure payment by Razorpay.</p>
    </form>
  );
}
