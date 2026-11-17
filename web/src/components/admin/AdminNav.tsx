"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, SECTION, sectionOf, type SectionKey } from "@/components/admin/sections";

type Labels = Record<"home" | "members" | "add" | "renewals" | "loans" | "donations" | "blacklist" | "upload" | "menu", string>;

const label = (k: SectionKey, t: Labels) => (k === "import" ? t.upload : t[k as keyof Labels]);

/** Computer: a column of big picture buttons. */
export function SideNav({ t }: { t: Labels }) {
  const cur = sectionOf(usePathname());
  const items: SectionKey[] = ["home", "members", "add", "renewals", "loans", "donations", "blacklist", "import"];
  return (
    <nav aria-label="Admin" className="grid gap-1.5">
      {items.map((k) => {
        const on = cur === k;
        return (
          <Link key={k} href={SECTION[k].href} aria-current={on ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-[1.05rem] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${on ? SECTION[k].tile : "hover:bg-sun/50"}`}>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${on ? "bg-white/15" : `${SECTION[k].tile}`}`}><Icon name={k} size={20} /></span>
            {label(k, t)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone: a bar fixed to the bottom with the five most used places. Everything else is on the Home screen. */
export function BottomNav({ t }: { t: Labels }) {
  const cur = sectionOf(usePathname());
  const items: SectionKey[] = ["home", "members", "add", "renewals", "loans"];
  return (
    <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map((k) => {
          const on = cur === k;
          return (
            <li key={k}>
              <Link href={SECTION[k].href} aria-current={on ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center text-[0.72rem] font-bold leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
                <span className={`grid h-9 w-12 place-items-center rounded-full transition-colors ${on ? SECTION[k].tile : "text-ink/70"}`}><Icon name={k} size={22} /></span>
                <span className={`line-clamp-2 ${on ? "text-ink" : "text-ink/70"}`}>{label(k, t)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
