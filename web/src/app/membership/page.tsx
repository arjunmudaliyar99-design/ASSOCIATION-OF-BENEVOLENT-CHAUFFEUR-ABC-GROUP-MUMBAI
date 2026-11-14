import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import LookupForm from "@/components/LookupForm";
import { limited, one } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { firstError, lookupSchema } from "@/lib/validate";

export const metadata: Metadata = { title: "Check your membership", robots: { index: false } };

async function find(_: unknown, fd: FormData) {
  "use server";
  if (await limited(`lookup:${await clientIp()}`, 10, 600)) return "Too many tries. Please wait 10 minutes.";
  const p = lookupSchema.safeParse({ phone: fd.get("phone"), member: fd.get("member") });
  if (!p.success) return firstError(p.error);
  const id = Number(p.data.member.replace(/\D/g, ""));
  const m = await one<{ token: string }>("SELECT token FROM members WHERE id = ? AND phone = ?", [id, p.data.phone]);
  if (!m) return "We couldn't find a membership with that mobile number and member number.";
  redirect(`/membership/${m.token}`);
}


export default function Membership() {
  return (
    <>
      <PageHero title="Check your membership" intro="Enter your mobile number and member number to see your card, expiry date, and renew." />
      <section className="bg-paper"><div className="wrap py-16"><LookupForm action={find} /></div></section>
    </>
  );
}
