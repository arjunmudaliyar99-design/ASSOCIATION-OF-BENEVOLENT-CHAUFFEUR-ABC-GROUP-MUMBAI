/**
 * One picture and one colour per admin section, used on the home tiles, the menu and page titles,
 * so the admins can find things by colour and picture, not only by reading.
 */
export type SectionKey = "home" | "members" | "add" | "renewals" | "loans" | "donations" | "blacklist" | "import";

const paths: Record<SectionKey | "search" | "phone" | "logout" | "back", React.ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>,
  members: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 13.6c2.3.2 4 1.8 4.5 4.6" /></>,
  add: <><circle cx="10" cy="8" r="3.4" /><path d="M3.5 19.5c.7-3.5 3.3-5.3 6.5-5.3 1.5 0 2.9.4 4 1.2" /><path d="M18 13v7M14.5 16.5h7" /></>,
  renewals: <><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4.5l3 2" /><path d="M9 3h6" /></>,
  loans: <><rect x="3" y="6.5" width="18" height="12" rx="2.5" /><circle cx="12" cy="12.5" r="2.6" /><path d="M6.5 9.5v6M17.5 9.5v6" /></>,
  donations: <><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" /></>,
  blacklist: <><circle cx="12" cy="12" r="8" /><path d="M6.4 6.4l11.2 11.2" /></>,
  import: <><path d="M6 3.5h8l4 4V20.5H6Z" /><path d="M14 3.5v4h4" /><path d="M12 16.5v-6M9.5 13l2.5-2.5 2.5 2.5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  phone: <><path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" /></>,
  logout: <><path d="M14 4h4.5v16H14" /><path d="M10 8l-4 4 4 4M6 12h9" /></>,
  back: <><path d="M15 5l-7 7 7 7" /></>,
};

export function Icon({ name, size = 26, className = "" }: { name: keyof typeof paths; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {paths[name]}
    </svg>
  );
}

/** Tile colours: strong enough to tell apart at a glance, with readable text on each (AA contrast). */
export const SECTION: Record<SectionKey, { href: string; tile: string; dot: string }> = {
  home: { href: "/admin", tile: "bg-ink text-sun", dot: "bg-ink" },
  members: { href: "/admin/members", tile: "bg-[#1f3a8a] text-white", dot: "bg-[#1f3a8a]" },
  add: { href: "/admin/members/new", tile: "bg-[#0f6b4f] text-white", dot: "bg-[#0f6b4f]" },
  renewals: { href: "/admin/renewals", tile: "bg-[#c2410c] text-white", dot: "bg-[#c2410c]" },
  loans: { href: "/admin/loans", tile: "bg-[#6d28d9] text-white", dot: "bg-[#6d28d9]" },
  donations: { href: "/admin/donations", tile: "bg-sun text-ink", dot: "bg-sun" },
  blacklist: { href: "/admin/blacklist", tile: "bg-[#991b1b] text-white", dot: "bg-[#991b1b]" },
  import: { href: "/admin/import", tile: "bg-[#475569] text-white", dot: "bg-[#475569]" },
};

/** Which section a path belongs to (for the menu highlight). */
export function sectionOf(path: string): SectionKey {
  if (path === "/admin") return "home";
  if (path.startsWith("/admin/members/new")) return "add";
  const hit = (Object.keys(SECTION) as SectionKey[]).find((k) => k !== "home" && k !== "add" && path.startsWith(SECTION[k].href));
  return hit ?? "home";
}
