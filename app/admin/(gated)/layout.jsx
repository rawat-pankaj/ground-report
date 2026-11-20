import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "../../../lib/session";

// Every admin page except the login page sits in this route group (the
// "(gated)" folder does not appear in addresses). proxy.js normally turns away
// visitors without a session, but on Vercel an encoded address such as
// /%61dmin/stats reached these pages without the proxy running. This server
// check closes that gap. The pages hold no data themselves (they load it from
// /api/admin/*, which checks the session too), so this only hides the frame.
export default async function GatedAdminLayout({ children }) {
  const cookieStore = await cookies();
  if (!(await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value))) {
    redirect("/admin/login");
  }
  return children;
}
