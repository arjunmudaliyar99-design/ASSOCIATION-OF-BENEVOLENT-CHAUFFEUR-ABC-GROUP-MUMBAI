import Link from "next/link";
import { Icon, SECTION, type SectionKey } from "@/components/admin/sections";
import TableLabels from "@/components/admin/TableLabels";

export const inr = (paise: number | bigint | null | undefined) => `₹${(Number(paise ?? 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const date = (d: string | null | undefined, lang = "en") => d ? new Date(d.length === 10 ? `${d}T00:00:00Z` : `${d.replace(" ", "T")}Z`).toLocaleDateString(`${lang}-IN`, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "–";

/** Page title with the section's picture, so every page looks like the tile that opened it. */
export function PageTitle({ title, sub, children, section }: { title: string; sub?: string; children?: React.ReactNode; section?: SectionKey }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {section && <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${SECTION[section].tile}`}><Icon name={section} size={30} /></span>}
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
          {sub && <p className="mt-0.5 text-ink/70">{sub}</p>}
        </div>
      </div>
      {children && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="font-semibold text-ink/75">{label}</span>
      <span className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl">{value}</span>
      {hint && <span className="text-sm text-ink/60">{hint}</span>}
    </>
  );
  const cls = "grid gap-1 rounded-3xl bg-card p-5 ring-1 ring-line transition-colors hover:bg-sun/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink";
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/**
 * A table on computers; on phones each row becomes a card (see .adm-table in globals.css),
 * so nobody has to scroll sideways. Column names are repeated inside each card from data-label.
 */
export function Table({ head, children, empty, emptyText = "Nothing here yet." }: { head: string[]; children: React.ReactNode; empty?: boolean; emptyText?: string }) {
  return (
    <TableLabels className="adm-table rounded-3xl bg-card ring-1 ring-line md:overflow-x-auto">
      <table className="w-full text-left text-base md:min-w-[720px]">
        <thead className="bg-sun/50"><tr>{head.map((h, i) => <th key={`${h}-${i}`} className="whitespace-nowrap px-4 py-3 font-bold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-lg text-ink/60">{emptyText}</p>}
    </TableLabels>
  );
}

/** Status: a coloured dot plus a word, never colour alone. */
const tones: Record<string, [string, string]> = {
  paid: ["bg-[#0f6b4f]/12 text-[#0b5a42]", "bg-[#0f6b4f]"], active: ["bg-[#0f6b4f]/12 text-[#0b5a42]", "bg-[#0f6b4f]"],
  pending: ["bg-sun/60 text-ink", "bg-[#b45309]"], created: ["bg-line text-ink", "bg-ink/40"],
  failed: ["bg-sindoor/15 text-sindoor", "bg-sindoor"], expired: ["bg-sindoor/15 text-sindoor", "bg-sindoor"], rejected: ["bg-sindoor/15 text-sindoor", "bg-sindoor"],
  open: ["bg-[#6d28d9]/12 text-[#5b21b6]", "bg-[#6d28d9]"], closed: ["bg-[#0f6b4f]/12 text-[#0b5a42]", "bg-[#0f6b4f]"], written_off: ["bg-line text-ink", "bg-ink/50"],
};
export function Pill({ s, label }: { s: string; label?: string }) {
  const [box, dot] = tones[s] ?? ["bg-line text-ink", "bg-ink/40"];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${box}`}>
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot}`} />{label ?? s[0].toUpperCase() + s.slice(1)}
    </span>
  );
}

export function Filters({ children, apply = "Apply" }: { children: React.ReactNode; apply?: string }) {
  return <form className="mb-5 flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 ring-1 ring-line">{children}<button className="btn-primary min-h-12 !px-6 !py-2.5 !text-base">{apply}</button></form>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1 text-base font-bold">{label}{children}</label>;
}

export const input = "min-h-12 w-full rounded-xl border-2 border-line bg-paper px-3 py-2 text-base font-normal text-ink focus:border-ink focus:outline-none sm:w-auto";

export const PAGE = 50;

export function Pager({ page, total, qs, base, t }: { page: number; total: number; qs: URLSearchParams; base: string; t: { prev: string; next: string; pageOf: string } }) {
  const pages = Math.ceil(total / PAGE);
  if (pages <= 1) return null;
  const link = (p: number) => `${base}?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) })}`;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      {page > 1 ? <Link href={link(page - 1)} className="btn-ghost min-h-12 !px-5 !py-2 !text-base">{t.prev}</Link> : <span />}
      <span className="font-semibold text-ink/70">{t.pageOf.replace("{p}", String(page)).replace("{n}", String(pages))}</span>
      {page < pages ? <Link href={link(page + 1)} className="btn-ghost min-h-12 !px-5 !py-2 !text-base">{t.next}</Link> : <span />}
    </div>
  );
}
