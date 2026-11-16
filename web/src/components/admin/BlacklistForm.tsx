"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBlacklist } from "@/app/admin/actions";
import DocInput from "@/components/DocInput";
import { input } from "@/components/admin/ui";
import type { Dict } from "@/i18n/en";

const lab = "grid gap-1 text-sm font-semibold";
const empty = { name: "", phone: "", reason: "", details: "" };

export default function BlacklistForm({ t }: { t: { admin: Dict["admin"]; join: Dict["join"] } }) {
  const b = t.admin.bl, j = t.join;
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [photo, setPhoto] = useState<string>();
  const [docs, setDocs] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [key, setKey] = useState(0);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const docT = { frontSide: j.frontSide, photoOrPdf: j.photoOrPdf, preparing: j.preparing, added: j.added, tapChange: j.tapChange, tooBigPdf: j.docTooBigPdf, wrongType: j.docWrongType, unreadable: j.docUnreadable };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(undefined);
    start(async () => {
      const r = await addBlacklist({ ...f, photo, docs });
      if ("error" in r) return setMsg({ ok: false, text: r.error });
      setF(empty); setPhoto(undefined); setDocs([undefined, undefined, undefined, undefined]); setKey((k) => k + 1);
      setMsg({ ok: true, text: b.added });
      router.refresh();
    });
  }

  return (
    <form key={key} onSubmit={submit} className="grid content-start gap-5 rounded-3xl bg-card p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-display text-2xl font-extrabold">{b.add}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lab}>{b.name}<input value={f.name} onChange={set("name")} required minLength={2} maxLength={80} autoComplete="off" className={input} /></label>
        <label className={lab}>{b.phone}<input value={f.phone} onChange={set("phone")} inputMode="numeric" maxLength={14} className={input} /></label>
      </div>
      <label className={lab}>{b.reason}<input value={f.reason} onChange={set("reason")} required minLength={3} maxLength={200} className={input} /></label>
      <label className={lab}>{b.details}<textarea value={f.details} onChange={set("details")} rows={3} maxLength={1000} className={input} /></label>
      <div className="grid gap-2">
        <p className="font-semibold">{b.photo}</p>
        <div className="max-w-xs"><DocInput id="bl-photo" label={b.photo} hint="JPG / PNG" t={docT} value={photo} onChange={(v, e) => { setPhoto(v); if (e) setMsg({ ok: false, text: e }); }} /></div>
      </div>
      <div className="grid gap-2">
        <p className="font-semibold">{b.docs}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.map((d, i) => (
            <DocInput key={i} id={`bl-doc-${i}`} label={b.docN.replace("{n}", String(i + 1))} hint={j.photoOrPdf} t={docT} value={d}
              onChange={(v, e) => { const next = [...docs]; next[i] = v; setDocs(next); if (e) setMsg({ ok: false, text: e }); }} />
          ))}
        </div>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-2xl px-4 py-3 font-semibold ${msg.ok ? "bg-sun/40 text-ink" : "bg-sindoor/10 text-sindoor"}`}>{msg.text}</p>}
      <div><button disabled={pending} className="btn-primary !px-8 !py-3 disabled:opacity-60">{pending ? b.saving : b.save}</button></div>
    </form>
  );
}
