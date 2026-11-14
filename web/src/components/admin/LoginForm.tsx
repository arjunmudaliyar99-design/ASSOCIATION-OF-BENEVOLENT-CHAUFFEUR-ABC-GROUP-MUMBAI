"use client";
import { useActionState } from "react";

export default function LoginForm({ action }: { action: (s: unknown, fd: FormData) => Promise<string | undefined> }) {
  const [err, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="glass grid gap-4 rounded-[2rem] p-7">
      <label htmlFor="a-user" className="grid gap-1.5"><span className="font-semibold">Username</span>
        <input id="a-user" name="username" autoComplete="username" required className="field" /></label>
      <label htmlFor="a-pass" className="grid gap-1.5"><span className="font-semibold">Password</span>
        <input id="a-pass" name="password" type="password" autoComplete="current-password" required className="field" /></label>
      {err && <p role="alert" className="rounded-xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</p>}
      <button disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
