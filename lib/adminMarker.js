// A second, readable cookie ("1") set and cleared alongside the admin session
// (app/api/auth/login and logout). It is NOT proof of anything (anyone can set
// it): it only tells the browser to show admin-only hints on public pages, e.g.
// "No featured story set" on the ready-made homepage (app/AdminHint.jsx). Admin
// pages and routes still check the signed session in lib/session.js.
// Kept in its own file so the browser bundle doesn't pull in lib/session.js.
export const ADMIN_MARKER_COOKIE = "pl_admin";
