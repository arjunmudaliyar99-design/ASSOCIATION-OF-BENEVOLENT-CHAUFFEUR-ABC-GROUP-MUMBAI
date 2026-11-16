"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { nav } from "@/data/site";
import { href, LANG_COOKIE, LANG_NAMES, LANGS, stripLang, type Lang } from "@/i18n/config";
import type { Dict } from "@/i18n/en";

type T = { nav: Dict["nav"]; org: Dict["org"]; common: Dict["common"] };

export function LangSwitch({ lang, admin, label }: { lang: Lang; admin?: boolean; label: string }) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  function pick(l: Lang) {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    if (admin) router.refresh();
    else router.push(href(l, stripLang(path)));
  }
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox" aria-label={label}
        className="glass flex h-11 items-center gap-2 rounded-full px-3.5 font-semibold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
        <span className="hidden sm:inline">{LANG_NAMES[lang]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" aria-label={label} initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-12 z-50 grid w-44 gap-1 rounded-2xl bg-paper p-2 shadow-[0_20px_50px_-15px_rgb(var(--ink)/.45)] ring-1 ring-line">
            {LANGS.map((l) => (
              <li key={l}>
                <button type="button" role="option" aria-selected={l === lang} onClick={() => pick(l)} lang={l}
                  className={`w-full rounded-xl px-4 py-2.5 text-left font-semibold transition ${l === lang ? "bg-ink text-sun" : "hover:bg-sun/60"}`}>{LANG_NAMES[l]}</button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header({ lang, t, admin }: { lang: Lang; t: T; admin?: boolean }) {
  const path = stripLang(usePathname());
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
  const L = (p: string) => href(lang, p);
  // The full menu only shows when it fits next to the organisation name; otherwise the menu button is used.
  // Translated labels are too long to fit beside the name, so those languages always use the menu button.
  const wide = lang === "en" ? { show: "2xl:flex", hide: "2xl:hidden" } : { show: "", hide: "" };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? "bg-paper/85 shadow-[0_8px_30px_-12px_rgb(var(--ink)/.25)] backdrop-blur-xl" : "bg-sun"}`}>
      <div className="wrap flex h-20 items-center gap-3 xl:gap-5">
        <Link href={admin ? "/admin" : L("/")} className="group mr-auto flex min-w-0 items-center gap-3" aria-label={`${t.org.fullName} – ${t.nav.home}`}>
          <span className="relative shrink-0">
            <span aria-hidden className="absolute -inset-1 rounded-full bg-gradient-to-tr from-honey via-paper to-honey opacity-80 blur-[2px] transition duration-700 group-hover:rotate-180" />
            <Image src="/logo.jpg" alt="" width={60} height={60} priority className="relative h-12 w-12 rounded-full shadow-lg ring-2 ring-paper transition duration-500 group-hover:scale-105 sm:h-[60px] sm:w-[60px]" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[0.95rem] font-extrabold sm:text-lg 2xl:text-base">{t.org.fullName}</span>
            <span className="block text-xs font-semibold tracking-wide text-ink/70 sm:text-sm">{t.org.city}</span>
          </span>
        </Link>
        {!admin && (
          <nav aria-label="Main" className={`glass hidden shrink-0 items-center gap-1 rounded-full p-1.5 ${wide.show}`}>
            {nav.map((n) => (
              <Link key={n.href} href={L(n.href)} aria-current={isActive(n.href) ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-full px-3.5 py-2 font-semibold transition-colors 2xl:px-4 ${isActive(n.href) ? "text-sun" : "hover:text-ink/70"}`}>
                {isActive(n.href) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <span className="relative">{t.nav[n.key]}</span>
              </Link>
            ))}
          </nav>
        )}
        <LangSwitch lang={lang} admin={admin} label={t.common.langLabel} />
        {!admin && <Link href={L("/donate")} className="btn-primary hidden !px-6 !py-2.5 sm:inline-flex">{t.common.donate}</Link>}
        {!admin && (
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mnav"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sun ${wide.hide}`} aria-label={t.nav.menu}>
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-0.5 w-5 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav id="mnav" aria-label="Mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }} className={`overflow-hidden bg-paper ${wide.hide}`}>
            <div className="wrap grid gap-1 py-5">
              {nav.map((n, i) => (
                <motion.div key={n.href} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 + i * 0.04 }}>
                  <Link href={L(n.href)} className={`block rounded-2xl px-4 py-3 font-display text-2xl font-bold ${isActive(n.href) ? "bg-sun" : ""}`}>{t.nav[n.key]}</Link>
                </motion.div>
              ))}
              <Link href={L("/donate")} className="btn-primary mt-3">{t.common.donate}</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <motion.div aria-hidden style={{ scaleX: progress }} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-ink" />
    </header>
  );
}
