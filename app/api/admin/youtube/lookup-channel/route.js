import { NextResponse } from "next/server";
import { lookupChannel } from "../../../../../lib/youtube";

export async function POST(request) {
  const { input } = await request.json();
  if (!input) return NextResponse.json({ error: "input is required" }, { status: 400 });

  try {
    const channel = await lookupChannel(input);
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    return NextResponse.json({ channel });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
