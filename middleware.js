import { NextResponse } from "next/server";

// Simple shared-password admin protection. Good enough for a small trusted
// editorial team; swap for real auth (NextAuth etc.) if the team grows.
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("admin_session")?.value;
  const isAuthed = session && session === process.env.ADMIN_PASSWORD;

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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
