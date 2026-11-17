import type { Metadata } from "next";
import { requireAdmin, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BottomNav, SideNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/admin/sections";
import { adminDict } from "@/i18n";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  await logout();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const { t } = await adminDict();
  const h = t.admin.home;
  const labels = { home: h.home, members: h.members, add: h.add, renewals: h.renewals, loans: h.loans, donations: h.donations, blacklist: h.blacklist, upload: h.upload, menu: h.menu };
  return (
    <div className="admin bg-paper text-[1.05rem]">
      <div className="wrap grid gap-6 pb-28 pt-5 lg:grid-cols-[248px_1fr] lg:gap-8 lg:pb-10 lg:pt-8">
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <div className="grid gap-3 rounded-3xl bg-card p-3 ring-1 ring-line">
            <SideNav t={labels} />
            <div className="grid gap-2 border-t border-line px-2 pt-3 text-sm">
              <span className="truncate text-ink/70">{t.admin.signedInAs} <b className="text-ink">{admin}</b></span>
              <form action={signOut}>
                <button className="flex min-h-11 w-full items-center gap-2 rounded-2xl bg-sindoor/10 px-3 py-2 font-bold text-sindoor hover:bg-sindoor/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sindoor">
                  <Icon name="logout" size={18} />{t.admin.signOut}
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Phone: who is signed in + sign out, above the page */}
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <span className="truncate text-sm text-ink/70">{t.admin.signedInAs} <b className="text-ink">{admin}</b></span>
          <form action={signOut}>
            <button className="flex min-h-11 items-center gap-1.5 rounded-full bg-sindoor/10 px-4 text-sm font-bold text-sindoor focus-visible:outline focus-visible:outline-2 focus-visible:outline-sindoor">
              <Icon name="logout" size={18} />{t.admin.signOut}
            </button>
          </form>
        </div>

        <div className="min-w-0">{children}</div>
      </div>
      <BottomNav t={labels} />
    </div>
  );
}
