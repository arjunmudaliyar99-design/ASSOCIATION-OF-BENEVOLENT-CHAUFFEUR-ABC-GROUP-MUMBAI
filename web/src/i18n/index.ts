import "server-only";
import { cookies } from "next/headers";
import en, { type Dict } from "./en";
import ta from "./ta";
import hi from "./hi";
import mr from "./mr";
import { DEFAULT_LANG, href, isLang, LANG_COOKIE, LANGS, type Lang } from "./config";

const dicts: Record<Lang, Dict> = { en, ta, hi, mr };

export function getDict(lang: Lang): Dict {
  return dicts[lang] ?? en;
}

/** Admin pages have no language in the URL; they follow the language last chosen in the switcher. */
export async function adminLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(c) ? c : DEFAULT_LANG;
}

export async function adminDict() {
  const lang = await adminLang();
  return { lang, t: getDict(lang) };
}

export type { Dict, Lang };

/** For pages under app/[lang]: language, dictionary and a link helper. */
export async function pageCtx(params: Promise<{ lang: string }>) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : DEFAULT_LANG;
  return { lang, t: getDict(lang), L: (p: string) => href(lang, p) };
}

export async function pageMeta(params: Promise<{ lang: string }>, pick: (t: Dict) => { title: string; description?: string }, path: string) {
  const { lang, t } = await pageCtx(params);
  const m = pick(t);
  return { title: m.title, description: m.description, alternates: { canonical: href(lang, path), languages: Object.fromEntries(LANGS.map((l) => [l, href(l, path)])) } };
}
