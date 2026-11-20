import { NextResponse } from "next/server";
import { lookupChannel } from "../../../../../lib/youtube";
import { readJson, badBody } from "../../../../../lib/http";
import { requireAdmin } from "../../../../../lib/adminAuth";

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const input = typeof body.input === "string" ? body.input.trim().slice(0, 500) : "";
  if (!input) return NextResponse.json({ error: "input is required" }, { status: 400 });

  try {
    const channel = await lookupChannel(input);
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    return NextResponse.json({ channel });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
