import { NextResponse } from "next/server";
import { getChannelVideos } from "../../../../../lib/youtube";
import { readJson, badBody } from "../../../../../lib/http";
import { requireAdmin } from "../../../../../lib/adminAuth";

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  // Both go into the YouTube request, so accept only the characters YouTube uses.
  const uploadsPlaylistId = typeof body.uploadsPlaylistId === "string" ? body.uploadsPlaylistId : "";
  const pageToken = typeof body.pageToken === "string" ? body.pageToken : "";
  if (!/^[\w-]{10,64}$/.test(uploadsPlaylistId)) {
    return NextResponse.json({ error: "A valid uploadsPlaylistId is required" }, { status: 400 });
  }
  if (pageToken && !/^[\w-]{1,100}$/.test(pageToken)) {
    return NextResponse.json({ error: "Invalid pageToken" }, { status: 400 });
  }

  try {
    const result = await getChannelVideos(uploadsPlaylistId, pageToken);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
