"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { causes, site } from "@/data/site";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error: { description: string } }) => void) => void } } }

function loadCheckout() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export default function DonateForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState(params.get("amount")?.replace(/[^\d.]/g, "") ?? "");
  const [cause, setCause] = useState(causes.some((c) => c.id === params.get("cause")) ? params.get("cause")! : "general");
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const rupees = Number(amount);
  const shown = rupees > 0 ? `₹${rupees.toLocaleString("en-IN")}` : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!(rupees >= 1)) return setErr("Enter the amount you'd like to give.");
    setBusy(true);
    try {
      const [ok, r] = await Promise.all([loadCheckout(), fetch("/api/donate/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: rupees, cause, ...f }) })]);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (!ok || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      const rz = new window.Razorpay({
        key: data.keyId, order_id: data.orderId, amount: data.amount, currency: "INR",
        name: site.name, description: causes.find((c) => c.id === cause)?.label, image: `${location.origin}/logo.jpg`,
        prefill: { name: f.name, email: f.email, contact: f.phone },
        notes: { cause }, theme: { color: "#1F1D6B" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/donate/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) }).then((x) => x.json()).catch(() => ({ ok: false }));
          router.push(`/donate/thank-you?id=${encodeURIComponent(resp.razorpay_payment_id)}&ok=${v.ok ? 1 : 0}`);
        },
      });
      rz.on("payment.failed", (r) => { setErr(`Payment didn't go through: ${r.error.description}. You have not been charged.`); setBusy(false); });
      rz.open();
    } catch (x) {
      setErr((x as Error).message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 rounded-3xl bg-card p-6 text-ink shadow-[0_10px_0_rgb(var(--navy))] sm:p-8">
      <label htmlFor="amount" className="grid gap-2">
        <span className="font-display text-xl font-bold">Amount</span>
        <span className="flex items-center rounded-2xl border-2 border-line bg-paper px-4 focus-within:border-ink">
          <span aria-hidden className="font-display text-4xl font-extrabold text-muted">₹</span>
          <input id="amount" inputMode="decimal" autoComplete="off" placeholder="Any amount" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
            className="w-full bg-transparent px-2 py-3 font-display text-4xl font-extrabold tabular-nums placeholder:text-muted/50 focus:outline-none" />
        </span>
      </label>

      <fieldset className="grid gap-2">
        <legend className="mb-2 font-display text-xl font-bold">Cause</legend>
        <div className="flex flex-wrap gap-2">
          {causes.map((c) => (
            <button type="button" key={c.id} onClick={() => setCause(c.id)} aria-pressed={cause === c.id}
              className={`relative rounded-full border-2 px-4 py-2 font-semibold transition ${cause === c.id ? "border-navy text-gold" : "border-line hover:border-ink"}`}>
              {cause === c.id && <motion.span layoutId="cause" className="absolute inset-0 -z-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 300, damping: 28 }} />}
              <span className="relative">{c.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="name" className="grid gap-1.5 sm:col-span-2"><span className="font-semibold">Full name</span>
          <input id="name" autoComplete="name" required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label htmlFor="email" className="grid gap-1.5"><span className="font-semibold">Email <span className="font-normal text-muted">(for your receipt)</span></span>
          <input id="email" type="email" autoComplete="email" required className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label htmlFor="phone" className="grid gap-1.5"><span className="font-semibold">Phone <span className="font-normal text-muted">(optional)</span></span>
          <input id="phone" type="tel" autoComplete="tel" className="field" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      </div>

      <AnimatePresence>
        {err && <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</motion.p>}
      </AnimatePresence>

      <button disabled={busy} className="btn-red w-full py-4 text-xl disabled:opacity-60">
        {busy ? "Opening secure payment…" : shown ? `Donate ${shown}` : "Donate"}
      </button>
      <p className="text-center text-sm text-muted">Secure payment by Razorpay. We never see your card or UPI details.</p>
    </form>
  );
}
