# PeopleLens (repo: ground-report)

Hand-curated portal of independent Indian YouTube journalism. Nothing appears on the public site unless the owner (Pankaj, sole developer/admin/curator) chose it. Live at https://www.peoplelens.in (canonical host is `www`; the bare domain redirects). Formerly "Ground Report"; the GitHub repo and local folder keep the name `ground-report`.

## Stack and coordinates
- Next.js **16.4.6, exact pin** (App Router, Turbopack), React 18 (the build warns that React 18 support goes away in Next 17), Tailwind 3, Prisma 5 + Supabase Postgres (RLS on), Vercel Hobby (auto-deploys `main`, Node 24.x, functions pinned to Mumbai `bom1` in `vercel.json`).
- Repo: github.com/rawat-pankaj/ground-report. Local path: `D:\Projects\ground-report` (Windows, PowerShell).
- Supabase: project **"PeopleLens"** (ref `vhuzrnjcadpwlzpqufmv`, Mumbai `ap-south-1`), organization "ItechNova". The only project; connections use the ref, not the names.
- Env vars (never commit `.env`, never print its values): `POSTGRES_PRISMA_URL` (pooled, Prisma `url`), `POSTGRES_URL_NON_POOLING` (direct, Prisma `directUrl`), `YOUTUBE_API_KEY`, `ADMIN_PASSWORD`. `.env.example` and the README list the same four.
- Commands: `npm run dev`, `npm run build` (runs `prisma generate` first). No tests; verify with a local build and by checking the running site.
- **Local runs use the live database** (`.env` points at it). Reading is fine; never click Save/Publish/Delete in a local admin page. Admin API checks can use a short-lived session token minted with `createSessionToken()` from `lib/session.js` (backdate it so it expires within an hour; delete it afterwards).

## Site map
- Public: `/` (static homepage), `/category/<slug>`, `/channel/<slug>`, `/video/<youtubeVideoId>`, `/search`, `/suggest`, `/about`, a custom 404 (`app/not-found.jsx`, shows the latest stories), `sitemap.xml`, `robots.txt`.
- Admin (`/admin/...`): Published Videos, Suggested Videos, Add video, Add channel, Categories, Places (backfill), Stats, Link check, login.
- `lib/`: `feed.js` (all cached public queries), `youtube.js`, `places.js` (suggest + normalise places), `draftNote.js` (draft notes from YouTube descriptions), `slug.js`, `search.js`, `session.js`, `adminMarker.js`, `indexnow.js`, `http.js`, `title.js`.

## Architecture rules that matter
- **Caching:** public data goes through `unstable_cache` with the tag `"videos"` (in `lib/feed.js`). **Every admin route that writes data must call `revalidateTag("videos")`.** No time-based revalidation (the sitemap is the exception: hourly). Vercel's data cache survives deploys: after a schema change, one small admin change refreshes cached pages.
- **Cache keys are the function arguments.** Every argument must come from a small validated set so nobody can mint unlimited cache entries: category slugs are checked against existing categories, channel slugs match `^[a-z0-9-]{1,60}$` and must exist, a channel page's `?category=` must be one of that channel's categories, `/api/feed` offsets must be a multiple of `PAGE_SIZE` and at most 2000. An unknown video or channel must **throw inside the cached function** (then it isn't cached) and become a 404.
- **Homepage is static:** `app/page.jsx` must not read cookies, `searchParams` or the server clock, or it is built on every visit again (check for `○ /` in the build's route table). The header date is `app/TodayDate.jsx`; the admin-only "no featured story" note is `app/AdminHint.jsx`, shown when the readable `pl_admin=1` marker cookie (`lib/adminMarker.js`, set at login, cleared at logout) is present. The marker proves nothing; it only shows or hides the note.
- **Admin gate:** `proxy.js` protects `/admin/*` and `/api/admin/*` with a signed, expiring session cookie (`lib/session.js`, key derived from `ADMIN_PASSWORD`; changing the password signs everyone out; the cookie is per hostname). It also 308-redirects old `/?category=<slug>` links to `/category/<slug>` (the matcher only sends `/` there when `?category=` is present). New admin routes go under the protected paths. Read request bodies with `readJson()`/`badBody()` from `lib/http.js` (never a bare `request.json()`), and answer 404 for a missing id.
- **Slugs are permanent addresses:** a category's slug is set when it is created and kept when it is renamed; a channel's slug is set when its first video is added (`uniqueSlug` in `lib/slug.js`, "-2" on a clash) and never follows YouTube renames.
- **Places:** saved places pass through `normalizePlace()` ("delhi, india" → "Delhi"; "City, State" or "State"). Suggestions (`suggestPlace()`, plain keyword matching, no AI, no network) are always shown in an editable field; nothing is saved unreviewed.
- **IndexNow:** admin routes that add, change or remove public video pages also announce them to Bing with `after(() => pingIndexNow([...paths]))` (`lib/indexnow.js`; only when `VERCEL_ENV === "production"`; key file `public/<key>.txt` must match the key in the code).
- **Database changes:** columns must exist in Supabase **before** the code that uses them deploys, otherwise every query (and the build's sitemap) fails. Write the SQL into `prisma/sql/<date>-<name>.sql`, have the owner run it in the Supabase SQL editor, update `prisma/schema.prisma`, then deploy. Prisma strings are JSON-safe; BigInt is not.
- **Security headers** live in `next.config.mjs` (CSP: `script-src 'self' 'unsafe-inline'`, `img-src` YouTube image hosts, `connect-src 'self'`, `frame-src https://www.youtube-nocookie.com`, `frame-ancestors 'none'`). Update the CSP if a feature needs a new origin.
- **Fonts are self-hosted** in `public/fonts/` with the rules in `app/fonts.css` (no Google Fonts request; the CSP doesn't allow those hosts). A changed font file needs a new file name (cached for a year, `immutable`). Only the featured card's image goes through `next/image` (`app/HeroImage.jsx`); keep other thumbnails as plain `<img>` (the free plan limits optimized images).
- **JSON-LD** on video pages is the only `dangerouslySetInnerHTML` in the app, and it escapes `<` as `\u003c`. Do not add other raw-HTML injection.
- **Homepage grid:** 4 columns on desktop with the featured card as a 2x2 block, so `PAGE_SIZE` in `lib/feed.js` must stay a **multiple of 4** (currently 48). Story cards are one link each (to `/video/<id>`); only the video page links out to YouTube.
- **YouTube API:** `videos.list` costs 1 unit per call (up to 50 ids); free-text channel search costs 100. Daily quota is 10,000. A video missing from the response is deleted or private. Always go through `safeFetchJson` (`lib/youtube.js`) so the API key can never leak in an error message.
- **Dependencies:** before any `npm audit fix` or upgrade, run it with `--dry-run` first and never use `--force` (it once moved Next's minor version). For a Next.js advisory, change the exact pin with `npm install next@<version> --save-exact`. The Next build may stop with a "SecurityFatalError" upgrade notice: a re-run continues, and its suggested `next upgrade --agent=…` command is not run without the owner's say-so.

## How the owner likes to work
- **UI changes:** show mockup options first (screenshots or an inline preview) and wait for the owner's pick before implementing. The owner often redirects after seeing a preview.
- **Short confirmations** ("done", "yes", "ok") mean proceed; do not re-ask. Ask clarifying questions only when a wrong guess would be costly to redo.
- Prefer whole-file replacements over scattered edits when a change touches most of a file.
- "Parked" is not "dropped": parked items return later, so keep them in `ISSUES.md`.
- **Commit and push only when asked.** On Windows use `git add .` (bracket folders like `app/video/[id]` act as globs in pathspecs). For bad deploys the owner uses Vercel's rollback rather than `git revert`.
- Do not write to the production database, delete data, or change Vercel/Supabase settings without asking first. Database changes go through SQL the owner runs.

## Tracking and validation
- `ISSUES.md` is the living tracker (about 200 KB). Do not read it whole: search for the section you need (headings are dated, e.g. "Channel and Category Pages — 2026-11-19"; the open list is under "Still open"). After shipping something, add a short dated section and tick or update the "Still open" list.
- After a push: wait for the Vercel deploy, then check the live site (and the specific behaviour that changed), not just that the build passed. Admin pages can't be fetched anonymously; the owner checks those. If a freshly fetched raw GitHub file looks stale, compare against `git ls-remote origin HEAD` before concluding the push failed.
- Search engines: Google Search Console (Domain property `peoplelens.in`) and Bing Webmaster Tools (site `peoplelens.in/`) both have `https://www.peoplelens.in/sitemap.xml`.
- Do not create `*_old*` backup copies; git keeps history.

## Pending and parked (detail in `ISSUES.md`)
- Next up: nomination email alerts and a notes export; RSS feed. (Admin sort/filter and bulk edit, the video sitemap and the Admin → Notes check are done.)
- Parked: click-to-play video on video pages; a "who runs PeopleLens" line on the About page; matching the "Why this matters" label to the note's language; React 19 upgrade before Next 17.
- Unscheduled ideas are listed only in `ISSUES.md` ("Ideas, not scheduled" under "Still open").
