import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import JoinForm from "@/components/JoinForm";
import { q } from "@/lib/db";
import { jobNetwork } from "@/data/site";

export const metadata: Metadata = { title: "Join the drivers' network", description: "Become a member of ABC Group Mumbai's drivers' job network. Pay online and get your membership card." };
export const dynamic = "force-dynamic";

export default async function Join() {
  const plans = (await q<{ id: string; label: string; months: number; price_paise: number }>(
    "SELECT id, label, months, price_paise FROM plans WHERE active = 1 ORDER BY sort, months")).map((p) => ({ ...p, months: Number(p.months), price_paise: Number(p.price_paise) }));
  return (
    <>
      <PageHero title="Join the drivers' network" intro={`Members share driving jobs with each other in our ${jobNetwork.members}-member WhatsApp group, without commission. Pay your membership here and the association will add you after checking your details.`} />
      <section className="bg-paper">
        <div className="wrap grid gap-12 py-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid content-start gap-6">
            <h2 className="font-display text-3xl font-extrabold">How joining works</h2>
            <ol className="grid gap-4">
              {[
                ["Choose a plan and fill in your details", "Your name, mobile number and driving licence number are needed."],
                ["Pay online", "UPI, card or netbanking through Razorpay."],
                ["Get your membership card", "You'll see your member number straight away. Save the link or take a screenshot."],
                ["The association checks your details", "Once approved, you'll be added to the WhatsApp group."],
              ].map(([h, p], i) => (
                <li key={h} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-sun">{i + 1}</span>
                  <span><b className="block text-lg">{h}</b><span className="text-ink/75">{p}</span></span>
                </li>
              ))}
            </ol>
            <p className="glass rounded-2xl p-4 text-ink/80">Already a member? <Link href="/membership" className="font-semibold underline">Check your membership or renew</Link>.</p>
          </div>
          {plans.length ? <Suspense><JoinForm plans={plans} /></Suspense> : <p className="rounded-3xl bg-card p-8">Membership plans will be available soon. Please contact the association.</p>}
        </div>
      </section>
    </>
  );
}
