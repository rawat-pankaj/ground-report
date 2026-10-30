import { NextResponse } from "next/server";
import { lookupVideo } from "../../../../../lib/youtube";
import { readJson, badBody } from "../../../../../lib/http";

export async function POST(request) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const { input } = body;
  if (!input) return NextResponse.json({ error: "input is required" }, { status: 400 });

  try {
    const result = await lookupVideo(input);
    if (!result) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
