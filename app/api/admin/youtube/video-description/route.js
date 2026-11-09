import { NextResponse } from "next/server";
import { getVideoDescription } from "../../../../../lib/youtube";
import { readJson, badBody } from "../../../../../lib/http";

// For the "Draft from description" button on Published Videos: returns the
// video's YouTube description and a draft note cut from it. Saves nothing.
export async function POST(request) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const videoId = typeof body.videoId === "string" ? body.videoId : "";
  if (!/^[\w-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "A valid videoId is required" }, { status: 400 });
  }

  try {
    const result = await getVideoDescription(videoId);
    if (!result) return NextResponse.json({ error: "Video not found on YouTube" }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
