import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./session";

// Second line of defence for admin routes. proxy.js already turns away
// requests without a valid session, but it matches the raw address: on Vercel
// an encoded address such as /%61dmin is routed to the admin pages without the
// proxy running (found 2026-11-20). So every admin API handler checks again
// here, and app/admin/(gated)/layout.jsx does the same for the pages.
//
// Changes (anything but GET/HEAD) must also come from this site. The session
// cookie is SameSite=Lax, which already keeps it off cross-site form posts;
// this check adds a second layer. A request with no Origin header (curl, some
// tools) still needs the session cookie, so it gains nothing.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSameOrigin(request) {
  if (SAFE_METHODS.has(request.method)) return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Returns a response to send back when the request must be refused, or null
// when it may go ahead. Usage at the top of a handler:
//   const denied = await requireAdmin(request);
//   if (denied) return denied;
export async function requireAdmin(request) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }
  return null;
}
