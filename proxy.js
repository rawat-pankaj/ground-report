import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

const CATEGORY_SLUG_RE = /^[a-z0-9-]{1,60}$/;

// Simple shared-password admin protection. Good enough for a small trusted
// editorial team; swap for real auth (NextAuth etc.) if the team grows.
// The cookie holds a signed, expiring token (lib/session.js), not the password.
//
// It also moves old homepage filter links, /?category=<slug>, to the category
// pages (308). That lives here rather than in app/page.jsx so the homepage
// doesn't read the address and can be served as a ready-made page. The
// matcher below only sends "/" here when a ?category= is present, so ordinary
// homepage visits never run this code.
export async function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/") {
    const category = searchParams.get("category") || "";
    const target = CATEGORY_SLUG_RE.test(category) ? `/category/${category}` : "/";
    return NextResponse.redirect(new URL(target, request.url), 308);
  }

  const isAuthed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    { source: "/", has: [{ type: "query", key: "category" }] },
  ],
};
