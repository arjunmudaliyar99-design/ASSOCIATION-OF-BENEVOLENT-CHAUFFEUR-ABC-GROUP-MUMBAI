import type { Metadata } from "next";
import { Suspense } from "react";
import DonateForm from "@/components/DonateForm";
import { features } from "@/data/site";

export const metadata: Metadata = {
  title: "Donate",
  description: "Donate any amount to ABC Group Mumbai by UPI, card or netbanking. Secure payments by Razorpay.",
};

export default function Donate() {
  return (
    <section className="relative overflow-hidden bg-sun text-on-sun">
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="grid content-start gap-6">
          <h1 className="font-display text-[clamp(2.75rem,6vw,4.75rem)] font-extrabold leading-[.95]">Give what feels right.</h1>
          <p className="max-w-lg text-xl opacity-90">There is no minimum and no suggested amount. Whatever you give goes to drivers&apos; families, children and ashrams across Mumbai.</p>
          <ul className="grid gap-3 text-lg">
            {["Pay by UPI, card, netbanking or wallet", "Payments secured by Razorpay", ...(features.has80G ? ["Tax deduction under Section 80G"] : []),
              "Payment confirmation sent to your email", "Pick a cause, or let us use it where it's needed most"].map((t) => (
              <li key={t} className="flex items-start gap-3"><span aria-hidden className="mt-2 h-3 w-3 shrink-0 rotate-45 bg-sindoor" />{t}</li>
            ))}
          </ul>
        </div>
        <Suspense fallback={<div className="h-[560px] rounded-3xl bg-card" />}>
          <DonateForm />
        </Suspense>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-3 bg-navy"><div className="lane mt-1 h-1 animate-drive" /></div>
    </section>
  );
}
