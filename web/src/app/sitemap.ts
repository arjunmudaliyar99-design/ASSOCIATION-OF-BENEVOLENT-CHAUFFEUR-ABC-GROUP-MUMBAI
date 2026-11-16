import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { href, LANGS } from "@/i18n/config";

const pages = ["/", "/about", "/our-work", "/hire-a-chauffeur", "/member-benefits", "/gallery", "/donate", "/contact", "/privacy", "/terms", "/refund-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((p) => LANGS.map((l) => ({
    url: `${site.url}${href(l, p) === "/" ? "" : href(l, p)}`,
    changeFrequency: "monthly" as const,
    priority: p === "/" ? 1 : p === "/donate" ? 0.9 : 0.6,
    alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${site.url}${href(x, p)}`])) },
  })));
}
