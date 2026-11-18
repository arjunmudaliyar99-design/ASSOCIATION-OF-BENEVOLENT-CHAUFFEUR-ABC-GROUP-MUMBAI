import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";
import { creator } from "@/data/creator";
import { fill, href, type Lang } from "@/i18n/config";
import type { Dict } from "@/i18n/en";

const ICON = {
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  insta: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01",
};
const Icon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0"><path d={d} /></svg>
);
const row = "flex w-fit max-w-full items-start gap-3 break-all font-semibold hover:underline";

export default function Footer({ lang, t }: { lang: Lang; t: Dict }) {
  const L = (p: string) => href(lang, p);
  const [before, after = ""] = t.footer.credit.split("{name}");
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
          <p className="flex gap-3 text-ink/80"><Icon d={ICON.pin} />{site.address}</p>
          <a className={row} href={`tel:${site.phone.replace(/\s/g, "")}`}><Icon d={ICON.phone} />{site.phone}</a>
          <a className={row} href={`tel:${site.phone2.replace(/\s/g, "")}`}><Icon d={ICON.phone} />{site.phone2}</a>
          <a className={row} href={`mailto:${site.email}`}><Icon d={ICON.mail} />{site.email}</a>
          <a className={row} href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer"><Icon d={ICON.insta} />@{site.instagram}</a>
        </div>
        <div className="grid content-start gap-2.5">
          <p className="mb-1 font-display text-xl font-extrabold">{t.footer.pages}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {pages.map(([l, h]) => <Link key={h} href={L(h)} className="text-ink/80 transition hover:translate-x-1 hover:text-ink">{l}</Link>)}
          </div>
        </div>
      </div>
      <div className="relative grid gap-1 border-t border-ink/15 px-4 py-5 text-center text-sm text-ink/70">
        <span>© {new Date().getFullYear()} {t.org.fullName}, {t.org.city}</span>
        <span>
          {before}
          <a href={creator.portfolio} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:underline">{creator.name}</a>
          {after}{" · "}{t.footer.creatorRole}
        </span>
      </div>
    </footer>
  );
}
