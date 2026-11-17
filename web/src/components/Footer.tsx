import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";
import { fill, href, type Lang } from "@/i18n/config";
import type { Dict } from "@/i18n/en";

export default function Footer({ lang, t }: { lang: Lang; t: Dict }) {
  const L = (p: string) => href(lang, p);
  const pages: [string, string][] = [
    [t.nav.home, "/"], [t.nav.about, "/about"], [t.nav.work, "/our-work"], [t.nav.rates, "/hire-a-chauffeur"], [t.nav.benefits, "/member-benefits"],
    [t.nav.gallery, "/gallery"], [t.footer.myMembership, "/membership"], [t.nav.contact, "/contact"],
    [t.footer.privacy, "/privacy"], [t.footer.terms, "/terms"], [t.footer.refund, "/refund-policy"],
  ];
  return (
    <footer className="relative overflow-hidden bg-honey text-ink">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 animate-spin-slow rounded-full border-[40px] border-sun/60" />
      <div className="wrap relative grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1.2fr]">
        <div className="grid content-start gap-5">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="" width={72} height={72} className="rounded-full shadow-lg" />
            <p className="font-display text-2xl font-extrabold leading-tight">{t.org.fullName}<span className="block text-base font-semibold text-ink/70">{t.org.city}</span></p>
          </div>
          <p className="max-w-sm text-ink/80">{fill(t.footer.about, { reg: site.regNo })}</p>
          <p className="font-display text-xl font-bold">{t.org.motto}</p>
          <Link href={L("/donate")} className="btn-primary w-fit max-w-full">{t.common.donate}</Link>
        </div>
        <div className="grid content-start gap-2.5">
          <p className="mb-1 font-display text-xl font-extrabold">{t.footer.visit}</p>
          <p className="text-ink/80">{site.address}</p>
          <a className="w-fit max-w-full font-semibold hover:underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
          <a className="w-fit max-w-full font-semibold hover:underline" href={`tel:${site.phone2.replace(/\s/g, "")}`}>{site.phone2}</a>
          <a className="w-fit max-w-full font-semibold hover:underline" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="w-fit max-w-full font-semibold hover:underline" href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">Instagram @{site.instagram}</a>
        </div>
        <div className="grid content-start gap-2.5">
          <p className="mb-1 font-display text-xl font-extrabold">{t.footer.pages}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {pages.map(([l, h]) => <Link key={h} href={L(h)} className="text-ink/80 transition hover:translate-x-1 hover:text-ink">{l}</Link>)}
          </div>
        </div>
      </div>
      <div className="relative border-t border-ink/15 py-5 text-center text-sm text-ink/70">© {new Date().getFullYear()} {t.org.fullName}, {t.org.city}</div>
    </footer>
  );
}
