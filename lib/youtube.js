const API_BASE = "https://www.googleapis.com/youtube/v3";

// Every call below embeds YOUTUBE_API_KEY directly in the request URL. A
// bare fetch()/`.json()` failure (network blip, DNS issue, YouTube outage
// returning non-JSON) can produce an error whose message or stack includes
// that URL — and route handlers return err.message straight to the client.
// Wrapping every call through here means the key can never end up in
// anything a route handler catches and forwards.
async function safeFetchJson(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Could not reach YouTube. Please try again.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("YouTube returned an unexpected response. Please try again.");
  }

  return data;
}

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
    const data = await safeFetchJson(`${API_BASE}/channels?part=snippet,contentDetails&${query}&key=${apiKey}`);
    if (data.items?.length) return formatChannel(data.items[0]);
  }

  const searchData = await safeFetchJson(
    `${API_BASE}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(identifier.value)}&key=${apiKey}`
  );
  const channelId = searchData.items?.[0]?.snippet?.channelId;
  if (!channelId) return null;

  const data2 = await safeFetchJson(`${API_BASE}/channels?part=snippet,contentDetails&id=${channelId}&key=${apiKey}`);
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

  const data = await safeFetchJson(`${API_BASE}/videos?part=snippet&id=${videoId}&key=${apiKey}`);
  const item = data.items?.[0];
  if (!item) return null;

  const channelData = await safeFetchJson(
    `${API_BASE}/channels?part=snippet,contentDetails&id=${item.snippet.channelId}&key=${apiKey}`
  );
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

  const data2 = await safeFetchJson(url);

  return {
    videos: (data2.items || [])
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item) => ({
        youtubeVideoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
        publishedAt: item.snippet.publishedAt,
      })),
    nextPageToken: data2.nextPageToken || null,
  };
}

// Checks whether already-curated videos can still be watched. Costs 1 quota
// unit per 50 videos (videos.list), so ~3 units for the whole catalogue.
// videos.list silently omits videos that were deleted or made private, so
// "missing from the response" is the signal. Also flags videos blocked in
// India (regionRestriction), since those are dead for this site's audience.
// Returns { [youtubeVideoId]: { state: "ok" | "unavailable" | "restricted", reason } }.
// If YouTube itself errors (quota, bad key), this THROWS rather than reporting
// everything as missing -- a failed check must never look like a dead catalogue.
export async function checkVideoAvailability(videoIds) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const results = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await safeFetchJson(
      `${API_BASE}/videos?part=status,contentDetails&maxResults=50&id=${batch.join(",")}&key=${apiKey}`
    );
    if (data.error || !Array.isArray(data.items)) {
      throw new Error("YouTube could not be checked right now (quota or API error). Nothing was changed.");
    }

    const found = new Map(data.items.map((item) => [item.id, item]));
    for (const id of batch) {
      const item = found.get(id);
      if (!item) {
        results[id] = { state: "unavailable", reason: "Deleted or made private" };
        continue;
      }

      const uploadStatus = item.status?.uploadStatus;
      if (["deleted", "failed", "rejected"].includes(uploadStatus)) {
        results[id] = { state: "unavailable", reason: `Upload status: ${uploadStatus}` };
        continue;
      }

      const rr = item.contentDetails?.regionRestriction;
      if (rr?.blocked?.includes("IN") || (rr?.allowed && !rr.allowed.includes("IN"))) {
        results[id] = { state: "restricted", reason: "Blocked in India" };
        continue;
      }

      results[id] = { state: "ok", reason: "" };
    }
  }
  return results;
}
