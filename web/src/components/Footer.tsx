import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-honey text-ink">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 animate-spin-slow rounded-full border-[40px] border-sun/60" />
      <div className="wrap relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-5">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="" width={72} height={72} className="rounded-full shadow-lg ring-4 ring-paper" />
            <p className="font-display text-3xl font-extrabold leading-none">{site.name}</p>
          </div>
          <p className="max-w-sm text-ink/80">{site.fullName}. Registered public trust, Reg. No. {site.regNo}.</p>
          <p className="font-display text-xl font-bold">{site.motto}</p>
          <Link href="/donate" className="btn-primary w-max">Donate</Link>
        </div>
        <div className="grid content-start gap-2.5">
          <p className="mb-1 font-display text-xl font-extrabold">Visit or call</p>
          <p className="text-ink/80">{site.address}</p>
          <a className="w-max font-semibold hover:underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
          <a className="w-max font-semibold hover:underline" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="w-max font-semibold hover:underline" href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">Instagram @{site.instagram}</a>
        </div>
        <div className="grid content-start gap-2.5">
          <p className="mb-1 font-display text-xl font-extrabold">Pages</p>
          {[["Home", "/"], ["About", "/about"], ["Our work", "/our-work"], ["Gallery", "/gallery"], ["Join the network", "/join"], ["My membership", "/membership"], ["Contact", "/contact"], ["Privacy policy", "/privacy"], ["Terms", "/terms"], ["Refund policy", "/refund-policy"]].map(([l, h]) => (
            <Link key={h} href={h} className="w-max text-ink/80 transition hover:translate-x-1 hover:text-ink">{l}</Link>
          ))}
        </div>
      </div>
      <div className="relative border-t border-ink/15 py-5 text-center text-sm text-ink/70">© {new Date().getFullYear()} {site.fullName}</div>
    </footer>
  );
}
