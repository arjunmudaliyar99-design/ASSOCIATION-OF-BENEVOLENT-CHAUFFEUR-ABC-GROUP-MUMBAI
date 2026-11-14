import { describe, expect, it } from "vitest";
import en from "@/i18n/en";
import ta from "@/i18n/ta";
import hi from "@/i18n/hi";
import mr from "@/i18n/mr";
import { href, stripLang } from "@/i18n/config";

/** Every translation must have the same keys, list lengths and {placeholders} as English. */
function problems(a: unknown, b: unknown, path = ""): string[] {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return [`${path}: list length differs`];
    return a.flatMap((x, i) => problems(x, b[i], `${path}[${i}]`));
  }
  if (a && typeof a === "object") {
    return Object.keys(a).flatMap((k) => (b && typeof b === "object" && k in b ? problems((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`) : [`${path}.${k}: missing`]));
  }
  if (typeof a === "string") {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    if (typeof b !== "string" || !b.trim()) return [`${path}: empty`];
    if (ph(a) !== ph(b)) return [`${path}: placeholders ${ph(a)} vs ${ph(b)}`];
  }
  return [];
}

describe("translations", () => {
  for (const [name, d] of [["Tamil", ta], ["Hindi", hi], ["Marathi", mr]] as const) {
    it(`${name} matches English`, () => expect(problems(en, d)).toEqual([]));
  }

  it("builds language links", () => {
    expect(href("en", "/about")).toBe("/about");
    expect(href("ta", "/")).toBe("/ta");
    expect(href("hi", "/join")).toBe("/hi/join");
    expect(stripLang("/ta/about")).toBe("/about");
    expect(stripLang("/mr")).toBe("/");
    expect(stripLang("/tamil")).toBe("/tamil");
  });
});
