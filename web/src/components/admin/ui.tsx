import Link from "next/link";

export const inr = (paise: number | bigint | null | undefined) => `₹${(Number(paise ?? 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const date = (d: string | null | undefined) => d ? new Date(d.length === 10 ? `${d}T00:00:00Z` : `${d.replace(" ", "T")}Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "–";

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-4xl font-extrabold">{title}</h1>{sub && <p className="text-ink/70">{sub}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="text-ink/70">{label}</span>
      <span className="font-display text-4xl font-extrabold tabular-nums">{value}</span>
      {hint && <span className="text-sm text-ink/60">{hint}</span>}
    </>
  );
  const cls = "grid gap-1 rounded-3xl bg-card p-5 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg";
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-card ring-1 ring-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-sun/50"><tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-ink/60">Nothing here yet.</p>}
    </div>
  );
}

const tones: Record<string, string> = {
  paid: "bg-ink text-sun", active: "bg-ink text-sun", pending: "bg-sun text-ink", created: "bg-line text-ink",
  failed: "bg-sindoor/15 text-sindoor", expired: "bg-sindoor/15 text-sindoor", rejected: "bg-sindoor/15 text-sindoor",
};
export function Pill({ s, label }: { s: string; label?: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${tones[s] ?? "bg-line"}`}>{label ?? s[0].toUpperCase() + s.slice(1)}</span>;
}

export function Filters({ children }: { children: React.ReactNode }) {
  return <form className="mb-5 flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 ring-1 ring-line">{children}<button className="btn-primary !px-5 !py-2.5 !text-base">Apply</button></form>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}{children}</label>;
}

export const input = "rounded-xl border-2 border-line bg-paper px-3 py-2 font-normal text-ink focus:border-ink focus:outline-none";

export const PAGE = 50;

export function Pager({ page, total, qs, base }: { page: number; total: number; qs: URLSearchParams; base: string }) {
  const pages = Math.ceil(total / PAGE);
  if (pages <= 1) return null;
  const link = (p: number) => `${base}?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) })}`;
  return (
    <div className="mt-4 flex items-center justify-between">
      {page > 1 ? <Link href={link(page - 1)} className="btn-ghost !px-4 !py-2 !text-base">Previous</Link> : <span />}
      <span className="text-ink/70">Page {page} of {pages}</span>
      {page < pages ? <Link href={link(page + 1)} className="btn-ghost !px-4 !py-2 !text-base">Next</Link> : <span />}
    </div>
  );
}
