import type { Metadata, Viewport } from "next";
import "../globals.css";
import Header from "@/components/Header";
import { fontClasses, fontVars } from "../fonts";
import { adminDict } from "@/i18n";

export const viewport: Viewport = { themeColor: "#FFC41F" };
export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const { lang, t } = await adminDict();
  return (
    <html lang={lang} className={fontClasses} style={fontVars(lang)}>
      <body>
        <Header lang={lang} t={{ nav: t.nav, org: t.org, common: t.common }} admin />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
