"use client";
import Link from "next/link";
import { useActionState } from "react";

export default function LookupForm({ action }: { action: (s: unknown, fd: FormData) => Promise<string | undefined> }) {
  const [err, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="mx-auto grid max-w-lg gap-5 rounded-[2rem] bg-card p-8 shadow-[0_30px_70px_-30px_rgb(var(--ink)/.45)] ring-1 ring-line">
      <label htmlFor="l-phone" className="grid gap-1.5"><span className="font-semibold">Mobile number</span>
        <input id="l-phone" name="phone" inputMode="numeric" autoComplete="tel" required className="field" /></label>
      <label htmlFor="l-member" className="grid gap-1.5"><span className="font-semibold">Member number</span>
        <input id="l-member" name="member" placeholder="ABC-00012" required className="field uppercase" /></label>
      {err && <p role="alert" className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</p>}
      <button disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Checking…" : "Show my membership"}</button>
      <p className="text-center text-ink/70">Not a member yet? <Link href="/join" className="font-semibold underline">Join the network</Link></p>
    </form>
  );
}
