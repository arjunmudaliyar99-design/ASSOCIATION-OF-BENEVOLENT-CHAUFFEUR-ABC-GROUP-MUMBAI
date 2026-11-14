import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { currentAdmin, login } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function signIn(_: unknown, fd: FormData) {
  "use server";
  const err = await login(String(fd.get("username") ?? ""), String(fd.get("password") ?? ""));
  if (err) return err;
  redirect("/admin");
}

export default async function Login() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <section className="glow grid min-h-[75vh] place-items-center px-4 py-16">
      <div className="grid w-full max-w-sm gap-6">
        <div className="grid justify-items-center gap-3 text-center">
          <Image src="/logo.jpg" alt="" width={72} height={72} className="rounded-full shadow-lg ring-4 ring-paper" />
          <h1 className="font-display text-3xl font-extrabold">Admin sign in</h1>
          <p className="text-ink/70">For the association&apos;s committee only.</p>
        </div>
        <LoginForm action={signIn} />
      </div>
    </section>
  );
}
