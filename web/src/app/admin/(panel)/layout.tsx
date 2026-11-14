import type { Metadata } from "next";
import { requireAdmin, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
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
  return (
    <div className="bg-paper">
      <div className="wrap grid gap-8 py-8 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass grid gap-1 rounded-3xl p-3">
            <p className="px-3 pb-2 pt-1 text-sm text-ink/60">{t.admin.signedInAs} <b className="text-ink">{admin}</b></p>
            <AdminNav t={t.admin.nav} />
            <form action={signOut}><button className="mt-2 w-full rounded-2xl px-4 py-2.5 text-left font-semibold text-sindoor hover:bg-sindoor/10">{t.admin.signOut}</button></form>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
