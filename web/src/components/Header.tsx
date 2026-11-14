"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nav, site } from "@/data/site";

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-sun text-on-sun transition-shadow ${scrolled ? "shadow-[0_4px_0_rgb(var(--navy)/.15)]" : ""}`}>
      <div className="wrap flex h-[72px] items-center gap-6">
        <Link href="/" className="mr-auto flex items-center gap-3" aria-label={`${site.name} home`}>
          <Image src="/logo.jpg" alt="" width={48} height={48} priority className="rounded-full ring-2 ring-navy" />
          <span className="font-display text-xl font-extrabold leading-none">ABC Group<span className="block text-sm font-semibold opacity-80">Mumbai</span></span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                className="relative rounded-full px-4 py-2 font-semibold transition hover:bg-on-sun/10">
                {n.label}
                {active && <motion.span layoutId="nav-dot" className="absolute inset-x-4 -bottom-0.5 h-1 rounded-full bg-sindoor" />}
              </Link>
            );
          })}
        </nav>
        <Link href="/donate" className="btn-red hidden !py-2 sm:inline-flex">Donate</Link>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mnav"
          className="grid h-11 w-11 place-items-center rounded-full border-2 border-current md:hidden" aria-label="Menu">
          <span className="relative block h-3 w-5">
            <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-0.5 w-5 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav id="mnav" aria-label="Mobile" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t-2 border-on-sun/15 md:hidden">
            <div className="wrap grid gap-1 py-4">
              {nav.map((n, i) => (
                <motion.div key={n.href} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link href={n.href} className="block rounded-xl px-3 py-3 font-display text-2xl font-bold">{n.label}</Link>
                </motion.div>
              ))}
              <Link href="/donate" className="btn-red mt-2">Donate</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <div aria-hidden className="h-1 bg-navy/90"><div className="lane h-full animate-drive opacity-70" /></div>
    </header>
  );
}
