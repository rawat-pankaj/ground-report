# Ground Report — Issues & Backlog

> Status: `[ ]` open · `[~]` in progress · `[x]` done  
> Update this file and commit alongside code changes to keep it in sync.

---

## 🐛 Known Issues

- [ ] **Featured card empty space** — `row-span-2` forces the hero card taller than its content when adjacent cards have short headlines. Workaround: accepted as-is for now. Fix: remove `row-span-2` from `FeaturedCard` in `app/page.jsx`.
- [ ] **No featured video — silent empty state** — If no video is marked "featured" in admin, the hero section disappears with no message. Should show an admin-only hint like "No featured story set — go to Admin to pin one."
- [ ] **Vercel Speed Insights PR** — Vercel bot auto-created a PR to add Speed Insights on a separate branch. Not yet merged. Review and merge or close at `github.com/rawat-pankaj/ground-report/pulls`.
- [ ] **Beat filter is case-sensitive** — `app/api/videos/route.js` uses Prisma `beatTags: { contains: beat }`, which maps to case-sensitive SQL `LIKE` on Postgres. Verified live: `/api/videos?beat=paper leak` → 3 results, `/api/videos?beat=Paper Leak` → 0. Masked today because admin normalizes beat tags to lowercase, so internal links always match. Becomes a real bug if beat URLs are ever exposed/typed by users (relevant to the backlog "clickable beat tags" item). Fix: add `mode: "insensitive"` to the `contains` filter.


---

## ✨ Pending Features

- [ ] **View count display** — DB column `viewCount` already exists (added, defaults to 0). YouTube fetch code written (`lib/youtube.js`, `app/api/admin/videos/route.js`, `app/api/cron/update-views/route.js`). Display on all cards in abbreviated format (1.2M, 45K). Needs: `CRON_SECRET` env var on Vercel + cron-job.org setup pointing to `/api/cron/update-views?secret=YOUR_SECRET`. Daily refresh planned.
- [ ] **Mobile review** — Site not yet tested on a phone. 2-column grid on mobile (featured card full width, regular cards 2-col) needs visual QA especially for Hindi text.

- [ ] **cron-job.org setup** — Needed for daily view count refresh once view counts are enabled. Sign up at cron-job.org, create job pointing to `https://ground-report-sable.vercel.app/api/cron/update-views?secret=CRON_SECRET`, schedule daily.

---

## 💡 Ideas / Backlog

- [ ] **Filter by channel** — Allow users to see all videos from a specific channel by clicking the channel name on a card.
- [ ] **Search** — Basic keyword search across video titles.
- [ ] **"More like this" beat links** — On the featured card, clicking a beat tag could filter the grid to that beat.
- [ ] **Admin: bulk language/tag edit** — Currently tags are edited one video at a time. A bulk-select-and-tag flow would speed up curation.
- [ ] **Admin: sort/filter dashboard** — Admin video list grows long. Filtering by language, beat, or status would help.
- [ ] **Nomination email alert** — When a new suggestion comes in via the public form, send a notification email to the admin.
- [ ] **About section on home page - Translate to Hindi
- [ ] **Page footer

---

## ✅ Done

- [x] Public feed with language filter (All / हिंदी / English)
- [x] Feed ordered by curation date (`addedAt DESC`)
- [x] Beat tag deduplication and lowercase normalization
- [x] Beat filter chips removed from public UI (tags stay in DB, power admin)
- [x] Featured hero card (col-span-2) with admin pin toggle
- [x] 4-column grid layout on desktop, 2-column on mobile
- [x] Featured card enriched: Watch on YouTube CTA, all beat tags, language badge
- [x] Language badges and beat stamps removed from regular cards (clean look)
- [x] Thumbnail cropping fix (`items-start` on flex row)
- [x] Blue masthead (#1A6EBD, Archivo Narrow 28px, white text)
- [x] "+ Suggest a video" red CTA button in masthead
- [x] Admin link hidden from public nav (accessible via `/admin` directly)
- [x] New tagline: "Ground-level reporting on issues that affect ordinary people! | Picked by hand | Not by algorithm"
- [x] Admin pages: nav links visible (ink color), Archivo Narrow headings, "The Desk" label removed
- [x] Suggest page: consistent font scheme, "Route a tip to the desk" removed
- [x] Vercel Analytics added
- [x] Git workflow: local → GitHub → Vercel auto-deploy
- [x] RLS enabled on all Supabase tables
- [x] Admin save feedback (Saved / error flash on field edits)
- [x] Next.js 16 async params/searchParams fixes
- [x] Language normalization (Hindi/hindi/हिंदी → hi)
- [x] viewCount column added to DB (Supabase migration run)
- [X] About section on home page - English
- [X] Hindi text at small sizes — Devanagari script at 13px (regular story cards) can feel cramped on dense titles. Consider bumping `StoryCard` headline to 14px.
- [X] Card hover state — Only the headline turns red on hover. A subtle border darkening or background shift on the card itself would make it feel more clearly clickable.
- [X] Thumbnail of Featured story is not very clear, it is getting pixeleted
- [X] Today's date on top of page
- [X] Feature Story visible tag in Admin section
- [X] News/Story Categories
- [X] Custom domain — Not started. Can be added via Vercel dashboard → Domains. (peoplelens.in)
- [X] Admin Page cleanup - Navbar arrangment, Authentication check, Admin logged in user

---

## 🧪 Testing Log

**2026-07-25 — Live testing pass** (About, /suggest, filtered URLs, public API), tested against production `ground-report-sable.vercel.app`:

- [x] **`/about`** — 200, prerendered (static). Title/meta correct, all sections render (intro, "What we look for", "How videos are chosen", "Anyone can contribute"), links back to `/` and `/suggest` work. Note: English-only (Hindi translation still open in backlog).
- [x] **`/suggest`** — 200, prerendered. Form renders with channel/video toggle + all 3 fields (link/name, reason, optional contact) + submit. Backend `app/api/nominations/route.js` (POST → `Nomination` table) reviewed: validates non-empty `input`, defaults `type` to "channel", trims optional fields, returns 400 on empty input. Minor: page `<title>` falls back to the generic site title rather than a suggest-specific one (SEO nit, not a bug).
- [x] **Public API `/api/videos`** — 200, valid JSON, 63 videos, correct shape (each includes nested `channel`), ordered by `addedAt DESC`, all `status: published`. Featured video correctly carries `featured: true`.
- [x] **`/api/videos?language=en`** — 200, 8 results, all `language: en`. Correct.
- [x] **`/api/videos?language=xx`** (invalid) — 200, `{"videos":[]}`. Graceful empty, no error.
- [x] **`/api/videos?beat=paper leak`** — 200, 3 results, all match. URL-encoded space handled.
- [x] **Filtered page `/?language=en`** — 200, "English" tag active, 8 cards, featured hero correctly suppressed under filter, dateline renders. Confirms Option-1 date change works on filtered views.
- [x] **404 handling** — bad route (`/nonexistent-xyz`) returns proper 404 with masthead intact, no crash.
- [ ] **FINDING: beat filter case-sensitive** — logged under Known Issues above.

---

## 🔒 Admin Security Audit — 2026-07-26

Full review of every `/admin` page, `/api/admin/*` route, and the auth layer (`proxy.js`), prompted by the admin nav/auth cleanup earlier this session.

**Fixed:**
- [x] **Nomination status had zero validation** (`PATCH /api/admin/nominations/[id]`) — any string could be written straight to the DB. Fixed: whitelisted to `pending`/`approved`/`rejected`, invalid values now return 400.
- [x] **Video status had weak validation** (`PATCH /api/admin/videos/[id]`) — old code used a truthy check only (`if (body.status)`), no whitelist, and silently ignored empty strings instead of rejecting them. Fixed: whitelisted to `published`/`hidden`, invalid values return 400.

**Open — real security/robustness items, roughly priority order:**
- [ ] **Public `/api/nominations` has no rate limit or input length cap** — open by design (it's the public suggestion form) but unprotected against spam/abuse or oversized payloads bloating the DB.
- [ ] **Session cookie is the plaintext admin password, not a signed token** — `admin_session` cookie value literally equals `ADMIN_PASSWORD`. Functional and cookie flags (httpOnly/secure/sameSite) are correct, but there's no way to invalidate one leaked session without rotating the password for everyone. Acceptable tradeoff for a small trusted-editor tool per the comment in `proxy.js`; worth revisiting if the team grows.
- [ ] **Timing-unsafe password comparison** (`===`) in both `proxy.js` and `/api/auth/login` — low real-world risk for a human-typed password, but not constant-time.
- [ ] **No try/catch around `request.json()`** across admin API routes — a malformed request body would throw an unhandled 500 instead of a clean error.
- [ ] **YouTube lookup routes' error handling is unpolished** — `lib/youtube.js` doesn't currently leak the API key in errors (checked), but a non-JSON error response from YouTube (e.g. during an outage) would throw an ugly generic error rather than a handled one.
- [ ] **`DELETE` on categories/videos doesn't pre-check existence** — deleting an already-gone `id` throws a Prisma "not found" error instead of a clean 404. Cosmetic only.

**Confirmed safe (checked, not assumed):**
- No XSS risk anywhere in admin — no `dangerouslySetInnerHTML`, React's auto-escaping covers all rendered user-submitted content (nomination `input`/`reasonText` included).
- `proxy.js` correctly covers every `/admin/*` page and `/api/admin/*` route found in the repo.
- Cookie flags (`httpOnly`, `secure` in production, `sameSite: lax`) are correctly set.

**Performance — fixed 2026-07-26:**
- [x] **`toggleStatus` and `setFeatured` in `/admin/page.jsx` used the slow full-list-reload pattern** — every click refetched all videos + categories on top of the actual save. Fixed: both now patch local state directly from the PATCH response (single round-trip, matching the `toggleCategory` fix from earlier). `setFeatured` also correctly clears `featured` on other videos locally, mirroring the server's un-feature-others behavior, so no stale "Featured" badge lingers.
- [x] **Bonus fix: `remove()` (Delete) had no error handling and also reloaded the full list** — now checks the DELETE response, alerts on failure instead of failing silently (closes audit finding on silent delete failure), and patches local state on success instead of reloading.

---

## 🏷️ Browser Tab Titles — 2026-07-26

- [x] **Admin login page had a "Desk access" eyebrow label above the heading** — removed (second time; first fix appears to have been reverted somewhere — worth checking git history if it recurs again).
- [x] **Admin tab title showed the full public tagline** ("PeopleLens — independent journalism, curated") instead of a distinct label — `/admin/layout.jsx` was a client component so couldn't export its own `metadata`. Fixed by extracting the nav into `AdminNav.jsx` (client) and making `layout.jsx` a server component with `title: "Admin — PeopleLens"`.
- [x] **Homepage tab title carried the tagline too** — shortened `app/layout.jsx` title from "PeopleLens — independent journalism, curated" to just "PeopleLens". `description` (used for search/link previews, not the tab) left unchanged.

---

*Last updated: 2026-07-26*
