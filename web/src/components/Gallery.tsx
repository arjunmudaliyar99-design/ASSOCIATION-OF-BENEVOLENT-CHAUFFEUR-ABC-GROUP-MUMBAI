"use client";
import Photo from "@/components/Photo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { albums } from "@/data/gallery";

export default function Gallery() {
  const [album, setAlbum] = useState("all");
  const photos = useMemo(() => albums.filter((a) => album === "all" || a.slug === album).flatMap((a) => a.photos.map((p) => ({ ...p, title: a.title }))), [album]);
  const [idx, setIdx] = useState<number | null>(null);
  const go = useCallback((d: number) => setIdx((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (idx === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setIdx(null); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [idx, go]);

  const cur = idx !== null ? photos[idx] : null;
  return (
    <section className="bg-paper py-12">
      <div className="wrap grid gap-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an album">
          {[{ slug: "all", title: "All photos" }, ...albums].map((a) => (
            <button key={a.slug} onClick={() => setAlbum(a.slug)} aria-pressed={album === a.slug}
              className={`rounded-full border-2 px-4 py-2 font-semibold transition ${album === a.slug ? "border-navy bg-navy text-gold" : "border-line bg-card hover:border-ink"}`}>
              {a.title}
            </button>
          ))}
        </div>
        <div key={album} className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {photos.map((p, i) => (
              <motion.button key={p.src} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.03 }} onClick={() => setIdx(i)}
                className="group relative mb-4 block w-full overflow-hidden rounded-2xl bg-line" aria-label={`Open photo: ${p.title}`}>
                <Photo src={p.src} alt={p.title} width={p.w} height={p.h} sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="h-auto w-full transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-navy/85 px-3 py-2 text-left text-sm font-semibold text-gold transition group-hover:translate-y-0">{p.title}</span>
              </motion.button>
            ))}
        </div>
      </div>

      <AnimatePresence>
        {cur && (
          <motion.div role="dialog" aria-modal aria-label={cur.title} className="fixed inset-0 z-[60] grid place-items-center bg-navy/95 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIdx(null)}>
            <motion.div key={cur.src} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 24 }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -60) go(1); else if (i.offset.x > 60) go(-1); }}
              onClick={(e) => e.stopPropagation()} className="relative h-[80vh] w-full max-w-5xl">
              <Photo src={cur.src} alt={cur.title} fill sizes="100vw" className="object-contain" priority />
            </motion.div>
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1.5 font-semibold text-navy">{cur.title} · {idx! + 1}/{photos.length}</p>
            {[["‹", -1, "left-3", "Previous photo"], ["›", 1, "right-3", "Next photo"]].map(([t, d, pos, l]) => (
              <button key={l as string} aria-label={l as string} onClick={(e) => { e.stopPropagation(); go(d as number); }}
                className={`absolute ${pos} top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-gold text-3xl font-bold text-navy`}>{t}</button>
            ))}
            <button aria-label="Close" onClick={() => setIdx(null)} className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-gold text-2xl font-bold text-navy">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
