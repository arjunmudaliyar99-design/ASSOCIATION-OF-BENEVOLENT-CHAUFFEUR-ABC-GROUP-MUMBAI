export const LANGS = ["en", "ta", "hi", "mr", "kn", "te", "ml"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";
export const LANG_NAMES: Record<Lang, string> = { en: "English", ta: "தமிழ்", hi: "हिन्दी", mr: "मराठी", kn: "ಕನ್ನಡ", te: "తెలుగు", ml: "മലയാളം" };
export const LANG_COOKIE = "abc_lang";

export const isLang = (s: unknown): s is Lang => typeof s === "string" && (LANGS as readonly string[]).includes(s);

/** English has no prefix (/about); other languages do (/ta/about). */
export function href(lang: Lang, path: string) {
  if (lang === DEFAULT_LANG) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Strips a language prefix from a pathname: /ta/about -> /about */
export function stripLang(pathname: string) {
  const m = pathname.match(/^\/(ta|hi|mr|kn|te|ml|en)(?=\/|$)/);
  return m ? pathname.slice(m[0].length) || "/" : pathname;
}

/** Replaces {name} placeholders. */
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
