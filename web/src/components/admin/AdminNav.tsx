"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type T = { overview: string; donations: string; members: string; renewals: string; import: string; blacklist: string; loans: string };

export default function AdminNav({ t }: { t: T }) {
  const items = [["/admin", t.overview], ["/admin/donations", t.donations], ["/admin/members", t.members], ["/admin/renewals", t.renewals], ["/admin/loans", t.loans], ["/admin/import", t.import], ["/admin/blacklist", t.blacklist]];
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:grid">
      {items.map(([h, l]) => {
        const on = h === "/admin" ? path === h : path.startsWith(h);
        return <Link key={h} href={h} aria-current={on ? "page" : undefined}
          className={`whitespace-nowrap rounded-2xl px-4 py-2.5 font-semibold transition ${on ? "bg-ink text-sun" : "hover:bg-sun/60"}`}>{l}</Link>;
      })}
    </nav>
  );
}
