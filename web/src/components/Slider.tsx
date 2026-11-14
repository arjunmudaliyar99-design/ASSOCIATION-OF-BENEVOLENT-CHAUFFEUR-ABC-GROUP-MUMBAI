"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Photo from "@/components/Photo";

export type Slide = { src: string; caption?: string };

/** Crossfading photo slider with a slow zoom, swipe, arrows, keyboard and an autoplay progress bar. */
export default function Slider({ slides, t, interval = 5000, className = "", sizes = "100vw", thumbs = false, priority = false }:
  { slides: Slide[]; t: { prev: string; next: string; show: string }; interval?: number; className?: string; sizes?: string; thumbs?: boolean; priority?: boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const go = useCallback((d: number) => setI((x) => (x + d + slides.length) % slides.length), [slides.length]);
  useEffect(() => setI(0), [slides]);
  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const t = setTimeout(() => go(1), interval);
    return () => clearTimeout(t);
  }, [i, paused, reduce, go, interval, slides.length]);
  const s = slides[i] ?? slides[0];
  if (!s) return null;

  return (
    <div className={`grid gap-4 ${className}`}>
      <div className="relative h-full min-h-0 overflow-hidden rounded-[2rem] bg-line shadow-[0_30px_70px_-25px_rgb(var(--ink)/.5)]"
        role="region" aria-roledescription="carousel" aria-label="Photos"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }} tabIndex={0}>
        <AnimatePresence initial={false}>
          <motion.div key={s.src} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeInOut" }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.x < -50) go(1); else if (info.offset.x > 50) go(-1); }}>
            <motion.div className="absolute inset-0" initial={{ scale: reduce ? 1 : 1.12 }} animate={{ scale: 1 }} transition={{ duration: interval / 1000 + 1, ease: "linear" }}>
              <Photo src={s.src} alt={s.caption ?? ""} fill sizes={sizes} priority={priority && i === 0} className="pointer-events-none select-none object-cover" draggable={false} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
        {s.caption && (
          <motion.p key={`c-${s.src}`} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="absolute bottom-5 left-5 rounded-full bg-sun px-4 py-1.5 font-display text-base font-bold text-ink shadow-lg">{s.caption}</motion.p>
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-5 right-5 flex gap-2">
            {[[t.prev, -1, "M15 18l-6-6 6-6"], [t.next, 1, "M9 6l6 6-6 6"]].map(([l, d, p]) => (
              <button key={l as string} aria-label={l as string} onClick={() => go(d as number)}
                className="grid h-11 w-11 place-items-center rounded-full bg-paper/90 text-ink shadow-lg backdrop-blur transition hover:scale-110 hover:bg-sun">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={p as string} /></svg>
              </button>
            ))}
          </div>
        )}
        {slides.length > 1 && (
          <div aria-hidden className="absolute inset-x-5 top-5 flex gap-1.5">
            {slides.slice(0, 12).map((x, k) => (
              <span key={x.src} className="h-1 flex-1 overflow-hidden rounded-full bg-paper/40">
                {k === i % 12 && <motion.span key={`${i}-${paused}`} className="block h-full bg-sun" initial={{ width: reduce || paused ? "100%" : "0%" }} animate={{ width: "100%" }} transition={{ duration: paused || reduce ? 0 : interval / 1000, ease: "linear" }} />}
                {k < i % 12 && <span className="block h-full bg-sun" />}
              </span>
            ))}
          </div>
        )}
      </div>
      {thumbs && slides.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {slides.map((x, k) => (
            <button key={x.src} onClick={() => setI(k)} aria-label={t.show.replace("{n}", String(k + 1))} aria-current={k === i}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl transition duration-300 ${k === i ? "ring-4 ring-ink" : "opacity-60 hover:opacity-100"}`}>
              <Photo src={x.src} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
