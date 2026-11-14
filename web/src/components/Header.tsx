"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { nav, site } from "@/data/site";

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const isActive = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? "bg-paper/85 shadow-[0_8px_30px_-12px_rgb(var(--ink)/.25)] backdrop-blur-xl" : "bg-sun"}`}>
      <div className="wrap flex h-20 items-center gap-6">
        <Link href="/" className="group mr-auto flex min-w-0 items-center gap-3" aria-label={`${site.fullName} home`}>
          <span className="relative shrink-0">
            <span aria-hidden className="absolute -inset-1 rounded-full bg-gradient-to-tr from-honey via-paper to-honey opacity-80 blur-[2px] transition duration-700 group-hover:rotate-180" />
            <Image src="/logo.jpg" alt="" width={60} height={60} priority className="relative h-12 w-12 rounded-full shadow-lg ring-2 ring-paper transition duration-500 group-hover:scale-105 sm:h-[60px] sm:w-[60px]" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[0.95rem] font-extrabold sm:text-lg lg:text-base xl:text-xl">Association of Benevolent Chauffeur</span>
            <span className="block text-xs font-semibold tracking-wide text-ink/70 sm:text-sm">ABC Group Mumbai</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 glass rounded-full p-1.5 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={`relative whitespace-nowrap rounded-full px-4 py-2 font-semibold xl:px-5 transition-colors ${isActive(n.href) ? "text-sun" : "hover:text-ink/70"}`}>
              {isActive(n.href) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative">{n.label}</span>
            </Link>
          ))}
        </nav>
        <Link href="/donate" className="btn-primary hidden !px-6 !py-2.5 sm:inline-flex">Donate</Link>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mnav"
          className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sun lg:hidden" aria-label="Menu">
          <span className="relative block h-3 w-5">
            <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-0.5 w-5 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav id="mnav" aria-label="Mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }} className="overflow-hidden bg-paper lg:hidden">
            <div className="wrap grid gap-1 py-5">
              {nav.map((n, i) => (
                <motion.div key={n.href} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 + i * 0.05 }}>
                  <Link href={n.href} className={`block rounded-2xl px-4 py-3 font-display text-2xl font-bold ${isActive(n.href) ? "bg-sun" : ""}`}>{n.label}</Link>
                </motion.div>
              ))}
              <Link href="/donate" className="btn-primary mt-3">Donate</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <motion.div aria-hidden style={{ scaleX: progress }} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-ink" />
    </header>
  );
}
