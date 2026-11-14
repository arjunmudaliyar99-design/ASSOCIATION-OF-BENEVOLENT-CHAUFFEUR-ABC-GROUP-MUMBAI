import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/our-work", "/gallery", "/donate", "/join", "/contact", "/privacy", "/terms", "/refund-policy"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : p === "/donate" ? 0.9 : 0.6,
  }));
}
