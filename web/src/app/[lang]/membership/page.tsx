import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import LookupForm from "@/components/LookupForm";
import { limited, one } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { lookupSchema } from "@/lib/validate";
import { getDict, pageCtx } from "@/i18n";
import { href, isLang } from "@/i18n/config";

export const metadata = { title: "Membership", robots: { index: false } };

async function find(_: unknown, fd: FormData) {
  "use server";
  const lang = isLang(fd.get("lang")) ? (fd.get("lang") as "en") : "en";
  const t = getDict(lang).lookup;
  if (await limited(`lookup:${await clientIp()}`, 10, 600)) return t.tooMany;
  const p = lookupSchema.safeParse({ phone: fd.get("phone"), member: fd.get("member") });
  if (!p.success) return t.notFound;
  const id = Number(p.data.member.replace(/\D/g, ""));
  const m = await one<{ token: string }>("SELECT token FROM members WHERE id = ? AND phone = ?", [id, p.data.phone]);
  if (!m) return t.notFound;
  redirect(href(lang, `/membership/${m.token}`));
}

export default async function Membership({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t, L } = await pageCtx(params);
  return (
    <>
      <PageHero title={t.lookup.title} intro={t.lookup.intro} />
      <section className="bg-paper"><div className="wrap py-16"><LookupForm action={find} lang={lang} t={t.lookup} joinHref={L("/join")} /></div></section>
    </>
  );
}
