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
  const l = isLang(lang) ? lang : "en";
  const title = `${site.name} – ${t.org.fullName}, Mumbai`;
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s | ${site.name}` },
    description: t.home.intro,
    applicationName: site.name,
    keywords: ["ABC Group Mumbai", "abcgroupmumbai", "Association of Benevolent Chauffeur", "ABC Group Mumbai trust", "chauffeur association Mumbai", "drivers association Mumbai", "hire a driver Mumbai", "driver welfare Mumbai", "donate Mumbai trust", site.regNo],
    authors: [{ name: site.fullName, url: site.url }],
    creator: site.fullName,
    publisher: site.fullName,
    category: "Non-profit organization",
    formatDetection: { telephone: true, email: true, address: true },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: {
      type: "website", siteName: site.name, title, description: t.home.intro, url: href(l, "/"),
      locale: { en: "en_IN", hi: "hi_IN", mr: "mr_IN", ta: "ta_IN" }[l],
      images: [{ url: "/photos/drivers-felicitation-bus-event/03.jpg", alt: site.fullName }],
    },
    twitter: { card: "summary_large_image", title, description: t.home.intro, images: ["/photos/drivers-felicitation-bus-event/03.jpg"] },
    alternates: { canonical: href(l, "/"), languages: { ...Object.fromEntries(LANGS.map((x) => [x, href(x, "/")])), "x-default": "/" } },
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

/** Structured data so search engines know who the organisation is (name variants, logo, contact, area). */
function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NGO", "@id": `${site.url}/#org`,
        name: site.fullName,
        alternateName: [site.name, "abcgroupmumbai", "ABC Group", "Association of Benevolent Chauffeur"],
        url: site.url, logo: `${site.url}/logo.jpg`, image: `${site.url}/photos/drivers-felicitation-bus-event/03.jpg`,
        description: "Registered public trust of chauffeurs in Mumbai: commission-free driver jobs, member welfare, and support for ashrams and children.",
        foundingDate: "2023-06-02", identifier: site.regNo,
        email: site.email, telephone: site.phone,
        address: { "@type": "PostalAddress", streetAddress: "136, Subhash Nagar, Gaondevi, Vakola Pipe Line, Santacruz (E)", addressLocality: "Mumbai", addressRegion: "Maharashtra", postalCode: "400055", addressCountry: "IN" },
        areaServed: { "@type": "City", name: "Mumbai" },
        sameAs: [`https://www.instagram.com/${site.instagram}/`],
        contactPoint: [{ "@type": "ContactPoint", telephone: site.phone, contactType: "customer support", areaServed: "IN", availableLanguage: ["English", "Hindi", "Marathi", "Tamil"] }],
      },
      { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, alternateName: [site.fullName, "abcgroupmumbai"], publisher: { "@id": `${site.url}/#org` }, inLanguage: ["en", "hi", "mr", "ta"] },
    ],
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang as Lang);
  return (
    <html lang={lang} className={fontClasses} style={fontVars(lang)}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd()).replace(/</g, "\\u003c") }} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-gold">{t.common.skip}</a>
        <Header lang={lang} t={{ nav: t.nav, org: t.org, common: t.common }} />
        <main id="main">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  );
}
