import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-navy text-[#FFF3CD]">
      <div className="lane h-2 animate-drive" aria-hidden />
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="" width={56} height={56} className="rounded-full ring-2 ring-gold" />
            <p className="font-display text-2xl font-extrabold text-gold">{site.name}</p>
          </div>
          <p className="max-w-sm opacity-85">{site.fullName}. Registered public trust, Reg. No. {site.regNo}.</p>
          <Link href="/donate" className="btn w-max bg-gold text-navy hover:-translate-y-0.5">Donate</Link>
        </div>
        <div className="grid content-start gap-2">
          <p className="font-display text-lg font-bold text-gold">Visit or call</p>
          <p className="opacity-85">{site.address}</p>
          <a className="hover:text-gold" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
          <a className="hover:text-gold" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="hover:text-gold" href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">Instagram @{site.instagram}</a>
        </div>
        <div className="grid content-start gap-2">
          <p className="font-display text-lg font-bold text-gold">Pages</p>
          {[["About", "/about"], ["Our work", "/our-work"], ["Gallery", "/gallery"], ["Contact", "/contact"], ["Privacy policy", "/privacy"], ["Terms", "/terms"], ["Refund policy", "/refund-policy"]].map(([l, h]) => (
            <Link key={h} href={h} className="w-max hover:text-gold">{l}</Link>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm opacity-70">© {new Date().getFullYear()} {site.fullName}</div>
    </footer>
  );
}
