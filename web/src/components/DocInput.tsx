"use client";
import { useState } from "react";

const MAX = 1_200_000;

/** Shrinks a phone photo to a clear, small JPEG (about 200–400 KB) so uploads are quick on mobile data. */
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  for (const q of [0.8, 0.65, 0.5]) {
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", q));
    if (b && b.size <= MAX) return b;
  }
  throw new Error("too big");
}

const toBase64 = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.onerror = rej;
  r.readAsDataURL(b);
});

export default function DocInput({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value?: string; onChange: (v: string | undefined, err?: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const isImg = value?.startsWith("data:image/");

  async function pick(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      let blob: Blob = f;
      if (f.type === "application/pdf") { if (f.size > MAX) throw new Error("pdf"); }
      else if (f.type.startsWith("image/")) blob = await compress(f);
      else throw new Error("type");
      setName(f.name);
      onChange(await toBase64(blob));
    } catch (e) {
      const m = (e as Error).message;
      onChange(undefined, m === "pdf" ? `${label}: the PDF is over 1 MB. Take a photo of the card instead.` : m === "type" ? `${label}: upload a photo or a PDF.` : `${label}: couldn't read that file. Try another photo.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label htmlFor={id} className={`group relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition ${value ? "border-ink bg-sun/30" : "border-line bg-paper hover:border-ink/50"}`}>
      <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-card ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
        {isImg ? <img src={value} alt="" className="h-full w-full object-cover" /> : value ? <span className="font-bold">PDF</span> :
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block truncate text-sm text-ink/70">{busy ? "Preparing…" : value ? `${name || "Added"} · tap to change` : hint ?? "Photo or PDF"}</span>
      </span>
      {value && <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-sun" aria-hidden>✓</span>}
      <input id={id} type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
    </label>
  );
}
