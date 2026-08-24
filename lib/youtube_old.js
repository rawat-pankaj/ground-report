const API_BASE = "https://www.googleapis.com/youtube/v3";

// Figures out what kind of input the admin pasted: a raw channel ID, a
// channel URL of any of YouTube's URL shapes, an @handle, or (as a last
// resort) free text that needs a real search.
function parseChannelInput(raw) {
  const trimmed = raw.trim();

  if (/^UC[\w-]{20,}$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1]) return { type: "id", value: parts[1] };
    if (parts[0]?.startsWith("@")) return { type: "handle", value: parts[0] };
    if (parts[0] === "c" && parts[1]) return { type: "handle", value: "@" + parts[1] };
    if (parts[0] === "user" && parts[1]) return { type: "user", value: parts[1] };
  } catch {
    if (trimmed.startsWith("@")) return { type: "handle", value: trimmed };
  }

  return { type: "search", value: trimmed };
}

function formatChannel(item) {
  return {
    youtubeChannelId: item.id,
    name: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails?.default?.url || null,
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  };
}

// Resolves a pasted URL/handle/ID to a channel. Costs ~1 quota unit for a
// direct ID/handle/username lookup. Only falls back to search.list
// (100 units) when the admin typed free text instead of a link.
export async function lookupChannel(rawInput) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const identifier = parseChannelInput(rawInput);
  let query = null;
  if (identifier.type === "id") query = `id=${identifier.value}`;
  else if (identifier.type === "handle") query = `forHandle=${encodeURIComponent(identifier.value)}`;
  else if (identifier.type === "user") query = `forUsername=${encodeURIComponent(identifier.value)}`;

  if (query) {
    const res = await fetch(`${API_BASE}/channels?part=snippet,contentDetails&${query}&key=${apiKey}`);
    const data = await res.json();
    if (data.items?.length) return formatChannel(data.items[0]);
  }

  const searchRes = await fetch(
    `${API_BASE}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(identifier.value)}&key=${apiKey}`
  );
  const searchData = await searchRes.json();
  const channelId = searchData.items?.[0]?.snippet?.channelId;
  if (!channelId) return null;

  const res2 = await fetch(`${API_BASE}/channels?part=snippet,contentDetails&id=${channelId}&key=${apiKey}`);
  const data2 = await res2.json();
  if (!data2.items?.length) return null;
  return formatChannel(data2.items[0]);
}

// Resolves a pasted video URL/ID to its details plus its channel's info,
// so the admin can publish a single video without browsing the whole channel.
// Costs ~1 quota unit (videos.list) + ~1 unit (channels.list).
export async function lookupVideo(rawInput) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const videoId = parseVideoId(rawInput);
  if (!videoId) return null;

  const res = await fetch(`${API_BASE}/videos?part=snippet&id=${videoId}&key=${apiKey}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  const channelRes = await fetch(
    `${API_BASE}/channels?part=snippet,contentDetails&id=${item.snippet.channelId}&key=${apiKey}`
  );
  const channelData = await channelRes.json();
  const channelItem = channelData.items?.[0];
  if (!channelItem) return null;

  return {
    video: {
      youtubeVideoId: item.id,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
      publishedAt: item.snippet.publishedAt,
    },
    channel: formatChannel(channelItem),
  };
}

function parseVideoId(raw) {
  const trimmed = raw.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const shortsMatch = url.pathname.match(/\/shorts\/([\w-]{11})/);
    if (shortsMatch) return shortsMatch[1];
  } catch {
    return null;
  }
  return null;
}

// Pages through a channel's uploads playlist. ~1 quota unit per page of
// up to 50 videos — cheap regardless of channel size.
export async function getChannelVideos(uploadsPlaylistId, pageToken) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const url =
    `${API_BASE}/playlistItems?part=snippet&maxResults=25&playlistId=${uploadsPlaylistId}&key=${apiKey}` +
    (pageToken ? `&pageToken=${pageToken}` : "");

  const res = await fetch(url);
  const data = await res.json();

  return {
    videos: (data.items || [])
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item) => ({
        youtubeVideoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
        publishedAt: item.snippet.publishedAt,
      })),
    nextPageToken: data.nextPageToken || null,
  };
}
