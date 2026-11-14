import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/data/site";
import { fontClasses, fontVars } from "../fonts";
import { getDict } from "@/i18n";
import { href, isLang, LANGS, type Lang } from "@/i18n/config";

export const viewport: Viewport = { themeColor: "#FFC41F" };
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(isLang(lang) ? lang : "en");
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} – ${t.org.motto}`, template: `%s | ${site.name}` },
    description: t.home.intro,
    openGraph: { type: "website", siteName: site.name, images: ["/photos/drivers-felicitation-bus-event/03.jpg"] },
    alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, href(l, "/")])) },
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang as Lang);
  return (
    <html lang={lang} className={fontClasses} style={fontVars(lang)}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-gold">{t.common.skip}</a>
        <Header lang={lang} t={{ nav: t.nav, org: t.org, common: t.common }} />
        <main id="main">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  );
}
