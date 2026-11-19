// IndexNow: tells Bing (and the other engines that share IndexNow, e.g. Yandex)
// that pages changed, so new and edited stories are crawled within hours instead
// of whenever the crawler next visits. Google does not use IndexNow; it reads the
// sitemap.
//
// The key is public by design: search engines check that
// https://www.peoplelens.in/<key>.txt (in public/) contains it, which proves the
// ping comes from the site owner. Changing the key means renaming that file too.
//
// Only the live site pings (VERCEL_ENV === "production"), so local builds and
// preview deployments never announce localhost or test URLs. Never throws: a
// failed ping only means the engines find the change on their next crawl.

export const INDEXNOW_KEY = "6af50d47cd21e00a49a5a1318b1278fc";
const HOST = "www.peoplelens.in";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10000; // per request, per the IndexNow spec

export async function pingIndexNow(paths) {
  if (process.env.VERCEL_ENV !== "production") return;

  const urlList = [...new Set(paths.filter(Boolean))]
    .slice(0, MAX_URLS)
    .map((p) => `https://${HOST}${p.startsWith("/") ? p : `/${p}`}`);
  if (!urlList.length) return;

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Ignored on purpose; see the note above.
  }
}
