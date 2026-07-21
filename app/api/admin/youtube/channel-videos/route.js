import { NextResponse } from "next/server";
import { getChannelVideos } from "../../../../../lib/youtube";

export async function POST(request) {
  const { uploadsPlaylistId, pageToken } = await request.json();
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
