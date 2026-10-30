import { NextResponse } from "next/server";
import { getChannelVideos } from "../../../../../lib/youtube";
import { readJson, badBody } from "../../../../../lib/http";

export async function POST(request) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const { uploadsPlaylistId, pageToken } = body;
  if (!uploadsPlaylistId) {
    return NextResponse.json({ error: "uploadsPlaylistId is required" }, { status: 400 });
  }

  try {
    const result = await getChannelVideos(uploadsPlaylistId, pageToken);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
