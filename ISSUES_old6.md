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
- [x] **Mobile review** — Done 2026-07-27, verified on a real device. See "Mobile Compatibility & QA" section below.

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

- [x] ~~Public feed with language filter (All / हिंदी / English)~~ — later removed from the homepage UI (2026-07-27); language field/data and admin editing kept, see Known Issues history.
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
- [x] ~~Public `/api/nominations` has no rate limit or input length cap~~ — **fixed 2026-07-27**, see "Public Nomination Rate Limiting" section below.
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
- [x] **Admin tab title showed the full public tagline** ("PeopleLens — independent journalism, curated") instead of a distinct label — `/admin/layout.jsx` was a client component so couldn't export its own `metadata`. Fixed by extracting the nav into `AdminNav.jsx` (client) and making `layout.jsx` a server component that exports its own title. Initially set to "Admin — PeopleLens", later reordered to **"PeopleLens - Admin"** per explicit request (2026-07-27) — this is the current, final value.
- [x] **Homepage tab title carried the tagline too** — shortened `app/layout.jsx` title from "PeopleLens — independent journalism, curated" to just "PeopleLens". `description` (used for search/link previews, not the tab) left unchanged.

---

## 🎨 Admin Masthead Label — 2026-07-26

- [x] **Bold "Admin" text in the admin nav bar looked like a broken/unclickable nav link, sitting inline with real links** — replaced with a proper mode indicator: the blue masthead now reads "PeopleLens / Admin" next to the wordmark, and "Log out" moved up into that same masthead row. `admin/layout.jsx` simplified to just the page nav (Published Videos, Suggested Videos, etc.) on its own row underneath. New `MastheadBar.jsx` replaces the old `MastheadNav.jsx` (deleted) to handle both public and admin masthead states in one place.
- [x] **"Log out" and the full admin nav were visible on the login page itself, before authenticating** — both now correctly hidden on `/admin/login`; the login screen shows only the PeopleLens wordmark and the password form.

---

## ⚡ Homepage Performance & Caching Architecture — 2026-07-27

**The problem:** category/language filter clicks on the homepage were slow — every click was a full page reload hitting Postgres fresh (`export const dynamic = "force-dynamic"`), with no caching layer at all, compounded by cross-region latency (Vercel `iad1` ↔ Supabase `ap-south-1`) and non-parallelized queries.

**Root cause found:** removing `force-dynamic` alone doesn't enable caching, because reading `searchParams` (needed for `?category=`/`?language=`/`?beat=` filters) is itself a Next.js "dynamic API" that forces per-request rendering regardless of that flag. The page-level response will correctly always show `cache-control: private, no-store` / `x-vercel-cache: MISS` — that's expected and doesn't indicate a problem.

**Fix implemented:** moved caching from the *page* to the *data fetching*, which doesn't depend on `searchParams` at the page level:
- [x] The three Prisma queries (categories with counts, featured hero, filtered video list) are wrapped in `unstable_cache` (`app/page.jsx`), tagged `"videos"`. The video query takes `language`/`beat`/`category` as real function arguments so each filter combination gets its own cache entry, not one shared/colliding key.
- [x] Category filter pills converted from plain `<a href>` to Next.js `<Link>` for client-side navigation — removes the full-page-reload feel on top of the data-layer fix.
- [x] Every admin write route that changes public-facing content now calls `revalidateTag("videos")` instead of the earlier `revalidatePath("/")`: `videos/[id]` (PATCH + DELETE), `videos` (POST), `categories` (POST), `categories/[id]` (PATCH + DELETE). Tag-based invalidation is the correct primitive here since the cache is keyed by filter arguments, not the route path.
- [x] `nominations/[id]` deliberately left alone — approving/rejecting a suggestion doesn't touch `Video` or `Category`, so it can't affect what's cached.

**Verification note (why this took a few rounds):** HTTP-level cache headers (`x-vercel-cache`) cannot distinguish "page not cached" from "data not cached" — both look identical from outside, which caused an initial false read that the fix wasn't working. Confirmed the fix is real by adding temporary `console.log` markers inside each cached function, hitting the same filtered URL twice, and checking Vercel function logs: the DB query log line appeared on the first request only — the second, identical request produced no query log at all, proving Postgres was skipped. Logging has since been removed; the cached functions are clean.

**Known edge case (not a bug, just documented behavior):** near-simultaneous concurrent requests for the *same uncached* filter combination can both miss the cache and both hit the DB (observed in logs — two requests 1ms apart for the same filter both queried). `unstable_cache` doesn't do in-flight request coalescing. Only matters under real concurrent load on a not-yet-cached key; harmless in practice for this traffic pattern.

**Separate finding surfaced during this work, not yet actioned:** Vercel logs showed a burst of ~50 near-identical `GET /` requests within about one second, unrelated to this fix. Worth a look at Vercel Analytics or bot traffic sometime — not investigated further here.

---

## 📱 Mobile Compatibility & QA — 2026-07-27

**Context:** the site had never been opened on a phone despite targeting an audience that is overwhelmingly mobile. Code review at a 380px viewport found six concrete problems.

**Root finding:** `app/globals.css` had **no responsive breakpoints at all** — 244 lines, and the only `@media` rule was `prefers-reduced-motion`. Every fixed size (28px wordmark, 11px chips) applied identically to a desktop monitor and a phone. All responsiveness came from a handful of Tailwind `lg:` classes in markup.

**Fixed:**
- [x] **Masthead overflowed narrow screens** — 28px `PEOPLELENS` wordmark + "About" + "+ Suggest a video" totalled roughly 408px of non-wrapping content inside a 380px viewport. Fixed: wordmark drops to 20px on mobile, nav gap tightens, and the CTA shortens to "+ Suggest". The CTA's inline styles moved into a `.masthead-cta` class so it can respond to viewport at all.
- [x] **Category row consumed the whole first screen** — 13 `white-space: nowrap` pills in a `flex-wrap` container ≈ 1,140px of chips into ~330px usable width, wrapping to about five rows (~165px). Combined with the date, tagline and credo line, no video content was visible without scrolling. Fixed with a new `.filter-strip` class: wraps on desktop, becomes a single horizontally swipeable row on mobile, with negative margins bleeding it to the screen edges to signal scrollability. Confirmed on device that it reads and behaves as swipeable.
- [x] **Tap targets too small** — `.tag` was `padding: 5px 10px` at 11px font ≈ 25px tall, well under Apple's 44px / Google's 48px guidance and packed with 8px gaps. Bumped to `padding: 11px 14px` at 12px on mobile.
- [x] **Featured card dead space on mobile** — `row-span-2` forced a two-row height, but at 2 columns the card is already full-width so nothing sits beside it; it just stretched. Changed to `lg:row-span-2` so the 2×2 block is desktop-only. This also partly addresses the long-standing "Featured card empty space" known issue.
- [x] **Sticky hover states on touch** — `.story-card:hover` (border darkening + shadow) and the headline colour change persist after a tap on touch devices. Disabled inside the mobile breakpoint.
- [x] **Cramped horizontal padding** — `px-6` (24px each side) left only ~332px of content on a 380px screen. Reduced to `px-4 sm:px-6` in both `app/layout.jsx` and `app/MastheadBar.jsx`.

**Verified on device (Vercel URL, real phone):** masthead fits, category strip swipes naturally, long Devanagari headlines in half-width cards render fine — that last one was the main thing not diagnosable from code. Single-column-below-400px was prepared as a fallback but proved unnecessary.

**Note:** the same `page.jsx` in this change also removed the temporary `[CACHE-PROOF]` `console.log` lines from the caching work above — that cleanup had been prepared but never deployed, so it rode along here. The `unstable_cache` setup itself is untouched and intact.

**Files touched:** `app/globals.css` (new mobile breakpoint block + `.filter-strip` / `.masthead-cta` classes), `app/page.jsx`, `app/MastheadBar.jsx`, `app/layout.jsx`. Desktop rendering is unchanged — every rule is inside a mobile media query or an `sm:`/`lg:` prefix.

---

## 🚦 Public Nomination Rate Limiting — 2026-07-27

**The problem:** `POST /api/nominations` (the `/suggest` form's backend) had no rate limit and no input length cap — genuinely open to the internet, unauthenticated by design. Risk was DB bloat from oversized payloads, the admin nominations queue getting flooded with scripted spam, and wasted function/DB load from casual bot abuse. Not an auth bypass or injection risk (both already confirmed safe in the security audit) — this was specifically a cost/abuse-resistance gap on the one open public write endpoint.

**Fixed:**
- [x] **New `NominationRateLimit` table** (Postgres, RLS enabled to match every other table) tracks one row per submission with `ipAddress` + `createdAt`, indexed on `(ipAddress, createdAt)`. A rolling window (not fixed buckets) avoids the classic burst-at-boundary flaw of fixed-window rate limiting.
- [x] **Limit: 10 submissions per IP per rolling hour**, returns `429` past that. Checked *before* the request body is parsed, so an over-limit caller doesn't cost a JSON parse either.
- [x] **Length caps, truncated not rejected**: `input` → 500 chars, `reasonText` → 1000, `submitterContact` → 200. Truncation (`.slice()`) rather than a hard error, so a genuine visitor who writes a long reason doesn't hit a confusing failure — matches the friendlier tone appropriate for a public form vs. the stricter enum-rejection used on the admin-side status fields.
- [x] **Self-pruning**: every submission opportunistically deletes rate-limit rows older than the window, so the table doesn't grow unbounded — no separate cron job needed. Both the rate-limit insert and the cleanup are fire-and-forget (`.catch(() => {})`, not awaited/blocking) so a hiccup there can never fail a nomination that already succeeded.
- [x] IP read from `x-forwarded-for` (first entry — Vercel's edge sets this authoritatively for real traffic), falling back to `x-real-ip`.

**Validated:** both files (`app/api/nominations/route.js`, `prisma/schema.prisma`) confirmed deployed byte-for-byte as written; `NominationRateLimit` table live in Supabase with correct schema; correct commit ("Nominations Rate limit") live on production including `peoplelens.in`; route correctly 405s on GET (POST-only); code logic order re-verified on the live deployed file. Not directly load-tested with a real POST (intentionally avoided writing synthetic data into the live nominations table) — an end-to-end check would need one real submission through `/suggest` followed by confirming a row appears in both `Nomination` and `NominationRateLimit`.

**Requires after deploy:** `npx prisma generate` so the Prisma client picks up the new `NominationRateLimit` model — same requirement as every prior schema change this project.

---

## 🌐 Custom Domain Not Serving Correctly — 2026-07-27

**The problem:** `www.peoplelens.in` showed the mobile fixes correctly on the direct Vercel URL, but not on the custom domain — turned out to be four separate causes stacked on top of each other, each only visible after the previous one was cleared:

- [x] **GoDaddy "Domain Forwarding / URL Masking" was framing the real site inside a legacy HTML frameset** instead of pointing DNS directly at Vercel — this is also where the "PoepleLens" tab-title typo (reported days earlier and never explained at the time) was actually coming from; the frameset page had its own stale, differently-branded title. Fixed by removing the forwarding/masking rule at the registrar.
- [x] **Generic DNS record values didn't match what Vercel actually wanted** — Vercel's dashboard gave domain-specific values (`A` → `216.198.79.1`, `www` `CNAME` → `123d949c33f1ab7e.vercel-dns-017.com.`) rather than the generic ones in Vercel's general docs. Used the exact values shown on the project's own Domains page.
- [x] **Vercel's own domain entries were set to "Redirect to Another Domain"** (307 → `ground-report-sable.vercel.app`) instead of "Connect to an environment" — meant the custom domain worked but always bounced the address bar to the `.vercel.app` URL. Switched both `peoplelens.in` and `www.peoplelens.in` to connect directly to Production.
- [x] **Stale DNS cache on the original testing network** — after the above fixes, one specific desktop network still 404'd while mobile (different network) worked immediately; a second desktop on the same network also failed. Confirmed via `dnschecker.org` that DNS had fully propagated globally (`216.198.79.1` everywhere) — the network's own router/ISP resolver just hadn't refreshed yet. Resolved itself (or via a phone-hotspot workaround) rather than needing further changes.

**Verified working:** confirmed via direct fetch (`200`, correct "PeopleLens" title, no redirect) and by the user on mobile, then on a PC via a different network. No code changes were involved — this was entirely registrar/Vercel dashboard configuration.

---

## 🔐 Admin Security Review — Round 2, and Login Brute-Force Fix — 2026-07-28

A second, deeper pass specifically hunting for anything an external attacker could exploit (as opposed to the first round's broader code-quality sweep). One real gap found and fixed; several specific, researched threats confirmed *not* present rather than just assumed safe.

**Fixed:**
- [x] **`/api/auth/login` had no rate limiting or lockout** — unlimited scripted password guesses were possible against the one endpoint on the site reachable without already being authenticated. Fixed: new `LoginAttempt` table (Postgres, same RLS/rolling-window pattern as `NominationRateLimit`); max **5 attempts per IP per rolling 15 minutes**, checked before the password is even compared, returns `429` past that. Every attempt (success or failure) is recorded. Failed attempts also get a **750ms artificial delay** before responding — free defense-in-depth on top of the rate limit. Self-pruning, same as the nomination limiter.
- [x] **`ipAddress: "unknown"` bucket edge case reviewed** — if `x-forwarded-for` is ever absent, all such requests share one counter. Checked directly against Vercel's own docs: Vercel overwrites this header and does not forward client-supplied values, specifically to prevent spoofing — so this isn't attacker-exploitable, and the "unknown" fallback essentially never triggers on real Vercel traffic.

**Specifically checked and confirmed NOT vulnerable (researched, not assumed):**
- **CVE-2025-29927** (critical, publicly-exploitable Next.js middleware/auth-bypass vulnerability disclosed March 2025 — a crafted header could skip `proxy.js` entirely and reach `/admin` unauthenticated). Checked the actual pinned version in `package.json`: `next: "^16.2.10"`, well past every patched threshold (12.3.5 / 13.5.9 / 14.2.25 / 15.2.3+). Not vulnerable.
- **SSRF via the YouTube lookup routes** (`lookup-channel`, `lookup-video`, `channel-videos`) — traced `lib/youtube.js` line by line: the fetch target is always the hardcoded `API_BASE` constant; admin-pasted input only ever lands in query-parameter values, never in the fetch URL itself. No path for the server to be tricked into fetching an attacker-chosen URL.
- **Secrets leaking into the client bundle** — searched every `"use client"` component for `process.env` usage and any `NEXT_PUBLIC_` misuse. `ADMIN_PASSWORD` and `YOUTUBE_API_KEY` only ever appear in server-only files.
- **Mass assignment on video updates** (`PATCH /api/admin/videos/[id]`) — the update object is built field-by-field from an explicit allowlist, not a raw spread of the request body.
- **Rate-limit bypass via IP spoofing** — same Vercel-header-overwrite finding as above; the nomination rate limiter from 2026-07-27 is not trivially bypassable this way either.
- **IDOR via ID guessing** — all IDs are `cuid()`-based (long, non-sequential). Not practically guessable.

**New minor finding, not yet fixed:**
- [ ] **`body.region` on the video PATCH route has zero validation** — accepts an arbitrary, unbounded string. Low real risk (admin-only input, not displayed anywhere special-cased), but inconsistent with how `status` is now protected. Same category as the pre-existing "no try/catch around `request.json()`" item above.

**Validated:** both new files (`app/api/auth/login/route.js`, `prisma/schema.prisma`) confirmed deployed byte-for-byte via diff; `LoginAttempt` table live in Supabase with correct schema and RLS; correct commit ("admin login rate-limiter") live in production. Logic re-verified on the live file. Not load-tested with real repeated login attempts (no POST-capable tool available this session) — a manual check would be deliberately mistyping the password 5-6 times on `/admin/login` and confirming the 6th attempt returns "Too many login attempts."

---

*Last updated: 2026-07-28*
