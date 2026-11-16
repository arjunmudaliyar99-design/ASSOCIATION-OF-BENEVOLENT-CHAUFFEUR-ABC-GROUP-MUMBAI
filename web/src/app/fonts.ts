import type React from "react";
import {
  Baloo_2, Baloo_Chettan_2, Baloo_Tamma_2, Baloo_Tammudu_2, Baloo_Thambi_2,
  Mukta, Mukta_Malar, Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Telugu,
} from "next/font/google";
import type { Lang } from "@/i18n/config";

// Same look in every script: Baloo for headings, a clean sans for text.
// Latin + Devanagari (English, Hindi, Marathi) load up front; the South Indian scripts load only when used.
const baloo = Baloo_2({ subsets: ["latin", "devanagari"], weight: ["600", "700", "800"], variable: "--f-baloo", display: "swap" });
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"], variable: "--f-mukta", display: "swap" });
const thambi = Baloo_Thambi_2({ subsets: ["tamil"], weight: ["600", "700", "800"], variable: "--f-thambi", display: "swap", preload: false, adjustFontFallback: false });
const malar = Mukta_Malar({ subsets: ["tamil"], weight: ["400", "600", "700"], variable: "--f-malar", display: "swap", preload: false, adjustFontFallback: false });
const tamma = Baloo_Tamma_2({ subsets: ["kannada"], weight: ["600", "700", "800"], variable: "--f-tamma", display: "swap", preload: false, adjustFontFallback: false });
const notoKn = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["400", "600", "700"], variable: "--f-noto-kn", display: "swap", preload: false, adjustFontFallback: false });
const tammudu = Baloo_Tammudu_2({ subsets: ["telugu"], weight: ["600", "700", "800"], variable: "--f-tammudu", display: "swap", preload: false, adjustFontFallback: false });
const notoTe = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "600", "700"], variable: "--f-noto-te", display: "swap", preload: false, adjustFontFallback: false });
const chettan = Baloo_Chettan_2({ subsets: ["malayalam"], weight: ["600", "700", "800"], variable: "--f-chettan", display: "swap", preload: false, adjustFontFallback: false });
const notoMl = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["400", "600", "700"], variable: "--f-noto-ml", display: "swap", preload: false, adjustFontFallback: false });

export const fontClasses = [baloo, mukta, thambi, malar, tamma, notoKn, tammudu, notoTe, chettan, notoMl].map((f) => f.variable).join(" ");

const scripts: Partial<Record<Lang, [string, string]>> = {
  ta: ["--f-thambi", "--f-malar"],
  kn: ["--f-tamma", "--f-noto-kn"],
  te: ["--f-tammudu", "--f-noto-te"],
  ml: ["--f-chettan", "--f-noto-ml"],
};

export function fontVars(lang: Lang): React.CSSProperties {
  const s = scripts[lang];
  return {
    ["--font-display" as string]: s ? `var(${s[0]}), var(--f-baloo)` : "var(--f-baloo)",
    ["--font-body" as string]: s ? `var(${s[1]}), var(--f-mukta)` : "var(--f-mukta)",
  };
}
