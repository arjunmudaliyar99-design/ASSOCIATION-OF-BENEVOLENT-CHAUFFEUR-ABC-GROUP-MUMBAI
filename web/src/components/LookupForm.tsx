"use client";
import Link from "next/link";
import { useActionState } from "react";
import type { Dict } from "@/i18n/en";

export default function LookupForm({ action, lang, t, joinHref }: { action: (s: unknown, fd: FormData) => Promise<string | undefined>; lang: string; t: Dict["lookup"]; joinHref: string }) {
  const [err, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="mx-auto grid max-w-lg gap-5 rounded-[2rem] bg-card p-8 shadow-[0_30px_70px_-30px_rgb(var(--ink)/.45)] ring-1 ring-line">
      <input type="hidden" name="lang" value={lang} />
      <label htmlFor="l-phone" className="grid gap-1.5"><span className="font-semibold">{t.mobile}</span>
        <input id="l-phone" name="phone" inputMode="numeric" autoComplete="tel" required className="field" /></label>
      <label htmlFor="l-member" className="grid gap-1.5"><span className="font-semibold">{t.member}</span>
        <input id="l-member" name="member" placeholder="ABC-0012" required className="field uppercase" /></label>
      {err && <p role="alert" className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</p>}
      <button disabled={pending} className="btn-primary disabled:opacity-60">{pending ? t.checking : t.show}</button>
      <p className="text-center text-ink/70">{t.notMember} <Link href={joinHref} className="font-semibold underline">{t.joinLink}</Link></p>
    </form>
  );
}
