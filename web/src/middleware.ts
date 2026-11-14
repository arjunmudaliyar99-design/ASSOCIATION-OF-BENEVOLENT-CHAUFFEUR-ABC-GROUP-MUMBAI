import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const LANG_PREFIX = /^\/(ta|hi|mr)(?=\/|$)/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin area: block anyone without a valid session cookie (pages also re-check on the server).
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const token = req.cookies.get("abc_admin")?.value;
    let ok = false;
    if (token && process.env.AUTH_SECRET) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), { algorithms: ["HS256"] });
        ok = true;
      } catch {}
    }
    if (ok) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Website: /ta/... /hi/... /mr/... are served as they are. Everything else is English, served from /en internally.
  if (pathname.startsWith("/en/") || pathname === "/en") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  // Remember the language last used on the website, so the admin dashboard opens in it too.
  const lang = pathname.match(LANG_PREFIX)?.[1] ?? "en";
  let res: NextResponse;
  if (lang !== "en") res = NextResponse.next();
  else {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    res = NextResponse.rewrite(url);
  }
  if (req.cookies.get("abc_lang")?.value !== lang) res.cookies.set("abc_lang", lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}

export const config = {
  // Skip Next internals, API routes (except admin) and files with an extension (images, csv, icons, robots, sitemap).
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!api|_next|.*\\..*).*)"],
};
