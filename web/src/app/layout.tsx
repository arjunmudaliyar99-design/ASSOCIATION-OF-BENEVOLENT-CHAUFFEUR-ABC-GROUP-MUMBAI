import type { Metadata, Viewport } from "next";
import { Baloo_Bhai_2, Mukta } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/data/site";

const display = Baloo_Bhai_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – ${site.motto}`, template: `%s | ${site.name}` },
  description: "Association of Benevolent Chauffeur Group Mumbai: Mumbai's drivers supporting each other, their families and children in need. Donate online with Razorpay.",
  openGraph: { type: "website", siteName: site.name, images: ["/photos/drivers-felicitation-bus-event/03.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#FFC41F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-gold">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
