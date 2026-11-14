import type React from "react";
import { Baloo_2, Baloo_Thambi_2, Mukta, Mukta_Malar } from "next/font/google";
import type { Lang } from "@/i18n/config";

// Same typefaces in every script: Baloo for headings, Mukta for text. Tamil uses their Tamil versions.
const baloo = Baloo_2({ subsets: ["latin", "devanagari"], weight: ["600", "700", "800"], variable: "--f-baloo", display: "swap" });
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"], variable: "--f-mukta", display: "swap" });
const thambi = Baloo_Thambi_2({ subsets: ["tamil"], weight: ["600", "700", "800"], variable: "--f-thambi", display: "swap", preload: false, adjustFontFallback: false });
const malar = Mukta_Malar({ subsets: ["tamil"], weight: ["400", "600", "700"], variable: "--f-malar", display: "swap", preload: false, adjustFontFallback: false });

export const fontClasses = `${baloo.variable} ${mukta.variable} ${thambi.variable} ${malar.variable}`;

export function fontVars(lang: Lang): React.CSSProperties {
  const ta = lang === "ta";
  return {
    ["--font-display" as string]: ta ? "var(--f-thambi), var(--f-baloo)" : "var(--f-baloo)",
    ["--font-body" as string]: ta ? "var(--f-malar), var(--f-mukta)" : "var(--f-mukta)",
  };
}
