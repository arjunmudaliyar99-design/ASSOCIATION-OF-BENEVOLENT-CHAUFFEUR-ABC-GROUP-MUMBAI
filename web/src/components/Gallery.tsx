"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Slider from "@/components/Slider";
import Photo from "@/components/Photo";
import { albums } from "@/data/gallery";

type T = { albums: Record<string, string>; photos: string; photo: string; slider: { prev: string; next: string; show: string } };

export default function Gallery({ t }: { t: T }) {
  const [slug, setSlug] = useState(albums[0].slug);
  const album = albums.find((a) => a.slug === slug)!;
  const slides = useMemo(() => album.photos.map((p) => ({ src: p.src, caption: t.albums[album.slug] ?? album.title })), [album, t]);

  return (
    <section className="bg-paper py-14 lg:py-20">
      <div className="wrap grid gap-14">
        {/* Album covers */}
        <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]" role="tablist" aria-label="Albums">
          {albums.map((a) => (
            <button key={a.slug} role="tab" aria-selected={slug === a.slug} onClick={() => setSlug(a.slug)}
              className={`group relative h-36 w-56 shrink-0 snap-start overflow-hidden rounded-2xl text-left transition duration-300 ${slug === a.slug ? "ring-4 ring-ink" : "opacity-80 hover:opacity-100"}`}>
              <Photo src={a.photos[0].src} alt="" fill sizes="224px" className="object-cover transition duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 font-display text-lg font-bold leading-tight text-paper">{t.albums[a.slug] ?? a.title}
                <span className="block text-sm font-semibold text-sun">{a.photos.length > 1 ? t.photos.replace("{n}", String(a.photos.length)) : t.photo}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Carousel */}
        <motion.div key={slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid gap-4">
          <h2 className="h-sec">{t.albums[album.slug] ?? album.title}</h2>
          <Slider slides={slides} t={t.slider} thumbs fit="contain" className="[&>div:first-child]:aspect-[16/10] [&>div:first-child]:max-h-[78vh] [&>div:first-child]:w-full" sizes="(min-width:1440px) 1300px, 100vw" interval={4500} />
        </motion.div>
      </div>
    </section>
  );
}
