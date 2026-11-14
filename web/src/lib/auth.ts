import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { limited, one, run } from "@/lib/db";

export const COOKIE = "abc_admin";
const HOURS = 12;

export function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export async function login(username: string, password: string): Promise<string | null> {
  const ip = await clientIp();
  if (await limited(`login:${ip}`, 8, 15 * 60)) return "Too many attempts. Try again in 15 minutes.";
  const a = await one<{ username: string; password_hash: string }>("SELECT username, password_hash FROM admins WHERE username = ?", [username.trim().toLowerCase()]);
  // Compare against a dummy hash when the user doesn't exist, so timing doesn't reveal valid usernames.
  const ok = await bcrypt.compare(password, a?.password_hash ?? "$2a$12$a0QnA6bkxqqaligZ1aVWg.iQ7QWNK11KeBKKIlnQvhNx0TbdJpWpi");
  if (!a || !ok) return "Wrong username or password.";
  const token = await new SignJWT({ sub: a.username }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${HOURS}h`).sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: HOURS * 3600 });
  await audit(a.username, "login");
  return null;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export async function currentAdmin(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const a = await currentAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

export async function audit(admin: string | null, action: string, detail?: string) {
  await run("INSERT INTO audit (admin, action, detail) VALUES (?, ?, ?)", [admin, action, detail ?? null]);
}

export async function createAdmin(username: string, password: string) {
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");
  const hash = await bcrypt.hash(password, 12);
  await run("INSERT INTO admins (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash", [username.trim().toLowerCase(), hash]);
}
