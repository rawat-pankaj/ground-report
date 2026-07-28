import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { password } = await request.json();
  const trimmed = (password || "").trim();

  if (!trimmed || trimmed !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set("admin_session", process.env.ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
