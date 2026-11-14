"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin", "Overview"], ["/admin/donations", "Donations"], ["/admin/members", "Members"],
  ["/admin/renewals", "Renewals"], ["/admin/import", "Import members"], ["/admin/plans", "Plans & prices"],
];

export default function AdminNav() {
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
