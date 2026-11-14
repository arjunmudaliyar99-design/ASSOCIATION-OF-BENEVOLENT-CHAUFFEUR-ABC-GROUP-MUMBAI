import Link from "next/link";
import { site } from "@/data/site";

export const metadata = { title: "Thank you", robots: { index: false } };

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ id?: string; ok?: string }> }) {
  const { id, ok } = await searchParams;
  const confirmed = ok === "1";
  return (
    <section className="bg-sun text-on-sun">
      <div className="wrap grid max-w-2xl justify-items-center gap-6 py-24 text-center">
        <div className="grid h-24 w-24 animate-beat place-items-center rounded-full bg-sindoor text-5xl text-white" aria-hidden>♥</div>
        <h1 className="font-display text-5xl font-extrabold leading-none">{confirmed ? "Thank you for your gift." : "We're confirming your payment."}</h1>
        <p className="text-xl opacity-90">
          {confirmed
            ? "Your donation has reached ABC Group Mumbai. Razorpay will email you a payment confirmation."
            : `If money left your account, it will be confirmed shortly. If you don't get a receipt within a day, write to ${site.email}.`}
        </p>
        {id && <p className="rounded-full bg-card px-4 py-2 font-semibold text-ink">Payment ID: <span className="select-all">{id}</span></p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/our-work" className="btn-ghost">See what your gift does</Link>
          <Link href="/" className="btn-red">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
