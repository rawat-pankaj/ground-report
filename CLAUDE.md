# PeopleLens (repo: ground-report)

Hand-curated portal of independent Indian YouTube journalism. Nothing appears on the public site unless the owner (Pankaj, sole developer/admin/curator) chose it. Live at https://www.peoplelens.in (canonical host is `www`). Formerly called "Ground Report"; the repo and DB keep that name.

## Stack and coordinates
- Next.js **16.4.1, exact pin** (the build warns that React 18 support is deprecated and goes away in Next 17) (App Router, Turbopack), React 18, Tailwind 3, Prisma 5 + Supabase Postgres (RLS on), Vercel Hobby (auto-deploys `main`; Node 20 is disabled for new deploys, so use 22+).
- Repo: github.com/rawat-pankaj/ground-report. Local path: `D:\Projects\ground-report` (Windows, PowerShell).
- Env vars (never commit `.env`, never print its values): `POSTGRES_PRISMA_URL` (pooled connection, used by `prisma/schema.prisma` as `url`), `POSTGRES_URL_NON_POOLING` (direct connection, used as `directUrl`), `YOUTUBE_API_KEY`, `ADMIN_PASSWORD`. These are the names the code actually reads (they match Vercel's Supabase integration). `.env.example` and the README list the same four names.
- Commands: `npm run dev`, `npm run build` (runs `prisma generate` first). There are no tests; verify with a local build and by checking the running site.

## Architecture rules that matter
- **Caching:** public data goes through `unstable_cache` with the tag `"videos"`. **Every admin route that writes data must call `revalidateTag("videos")`.** There is no time-based revalidation (the sitemap is the exception: `revalidate = 3600`).
- **Cache keys are the function arguments.** Every argument must come from a small validated set so nobody can mint unlimited cache entries: categories are checked against existing slugs, language is two letters, `/api/feed` offsets must be a multiple of `PAGE_SIZE` and at most 2000. A video page for an unknown id must throw inside the cached function so misses are not cached.
- **Admin gate:** `proxy.js` protects `/admin/*` and `/api/admin/*` with a signed, expiring session cookie (`lib/session.js`, key derived from `ADMIN_PASSWORD`; changing the password signs everyone out; the login cookie is per hostname). New admin routes go under those paths. Read request bodies with `readJson()`/`badBody()` from `lib/http.js` (never a bare `request.json()`), and answer 404 for a missing id.
- **Database changes:** the columns must exist in Supabase **before** the code that uses them deploys, otherwise every query fails. Write the SQL (e.g. `ALTER TABLE ... ADD COLUMN`), have the owner run it in the Supabase SQL editor, then deploy. Prisma strings are JSON-safe; BigInt is not.
- **Security headers** live in `next.config.mjs` (CSP: `script-src 'self' 'unsafe-inline'`, `connect-src 'self'`, `frame-src https://www.youtube-nocookie.com`, `frame-ancestors 'none'`). Update the CSP if a feature needs a new origin.
- **Fonts are self-hosted:** the woff2 files are in `public/fonts/` with the rules in `app/fonts.css` (no Google Fonts request, and the CSP no longer allows those hosts). To add a weight, download the file, add an `@font-face` block, and use a new file name if a font changes (the files are cached for a year, `immutable`). The featured card's image goes through `next/image` via `app/HeroImage.jsx`; keep other thumbnails as plain `<img>` (the free plan limits optimized source images).
- **JSON-LD** on video pages is the only use of `dangerouslySetInnerHTML` in the app, and it escapes `<` as `\u003c`. Do not add other raw-HTML injection.
- **Homepage grid:** 4 columns on desktop and the featured card occupies a 2x2 block, so `PAGE_SIZE` in `lib/feed.js` must stay a **multiple of 4** (currently 48) or the last row has gaps. Grid cards and the hero both link to `/video/<youtubeVideoId>`; only the video page links out to YouTube.
- **YouTube API:** `videos.list` costs 1 unit per call (up to 50 ids). Daily quota is 10,000. A video missing from the response is deleted or private. Always wrap calls in `safeFetchJson` (`lib/youtube.js`) so the API key can never leak in an error message.
- Place suggestions come from `lib/places.js` (plain keyword matching, no AI, no network). Suggestions are always shown in an editable field; nothing is saved unreviewed.

## How the owner likes to work
- **UI changes:** show mockup options first (screenshots or an inline preview) and wait for his pick before implementing. He often redirects after seeing a preview.
- **Short confirmations** ("done", "yes", "ok") mean proceed; do not re-ask. Ask clarifying questions only when a wrong guess would be costly to redo.
- Prefer whole-file replacements over scattered edits when a change touches most of a file.
- "Parked" is not "dropped": parked items return later, so keep them in `ISSUES.md`.
- **Commit and push only when asked.** On Windows use `git add .` (bracket folders like `app/video/[id]` act as globs in pathspecs). For bad deploys he uses Vercel's rollback rather than `git revert`.
- Do not write to the production database, delete data, or change Vercel/Supabase settings without asking first.

## Tracking and validation
- `ISSUES.md` is the living tracker (about 85 KB). Do not read it whole: search for the section you need (headings are dated, e.g. "Video Detail Pages & Link Check", "Still open"). After shipping something, add a short dated section and tick or update the "Still open" list.
- After a push: wait for the Vercel deploy, then check the live site (and the specific behaviour that changed), not just that the build passed. If a freshly fetched raw GitHub file looks stale, compare against `git ls-remote origin HEAD` before concluding the push failed.
- `/admin/*` pages are behind the password cookie and cannot be fetched anonymously.

## Repo housekeeping
- All `*_old*` backup files were removed on 2026-10-27 (27 files, nothing referenced them). Git history keeps them. Do not create new `_old` copies; use git for history.

## Parked items (see `ISSUES.md` for detail)
- Plan a React 19 upgrade before Next 17. (`npm audit` is clean as of 2026-10-31; before any future `audit fix`, run it with `--dry-run` first and never use `--force`, since it once moved Next's minor version.)
- Place backfill for existing videos (Admin → Places; built earlier, not pushed).
- AI-drafted "Why this matters" notes (on hold; YouTube's own AI summary is not available through the API).
- Channel pages and real `/category/[slug]` routes (the next SEO step).
- Done 2026-10-27/28 and no longer parked: Vercel Node 24.x, the apex redirect, the cold-load speed fix (functions pinned to `bom1`), on-site search (home-page pill plus `/search`), footer, card labels and dates, the Next.js 16.4.1 upgrade, and the admin "no featured story" hints.
- Beat tags, Instagram, bulk admin edit and admin sort/filter, rate-limit consolidation, `unstable_cache` to `use cache`, nomination email alerts, Hindi About page, RSS feed, the modern header directions, the empty `/search` page.
- Paused duplicate Supabase project "GroundReport" (Tokyo) can be deleted if unused.
