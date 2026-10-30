# Ground Report — Issues & Backlog

> Status: `[ ]` open · `[~]` in progress · `[x]` done  
> Update this file and commit alongside code changes to keep it in sync.

---

## 🐛 Known Issues

- [ ] **Featured card empty space** — `row-span-2` forces the hero card taller than its content when adjacent cards have short headlines. Workaround: accepted as-is for now. Fix: remove `row-span-2` from `FeaturedCard` in `app/page.jsx`.
- [x] **No featured video — silent empty state** — If no video is marked "featured" in admin, the hero section disappears with no message. Should show an admin-only hint like "No featured story set — go to Admin to pin one." Done 2026-10-28, see "Admin Hint When Nothing Is Featured" at the end of this file.
- [x] ~~**Vercel Speed Insights PR**~~ — merged 2026-08-02, real data now flowing. Turned into a multi-round debugging saga — see "Speed Insights Rollout" below.
- [x] **Beat filter is case-sensitive** — OBSOLETE (2026-10-28): the `/api/videos` route was removed on 2026-10-27 and beat is no longer a public filter. Original note: `app/api/videos/route.js` uses Prisma `beatTags: { contains: beat }`, which maps to case-sensitive SQL `LIKE` on Postgres. Verified live: `/api/videos?beat=paper leak` → 3 results, `/api/videos?beat=Paper Leak` → 0. Masked today because admin normalizes beat tags to lowercase, so internal links always match. Becomes a real bug if beat URLs are ever exposed/typed by users (relevant to the backlog "clickable beat tags" item). Fix: add `mode: "insensitive"` to the `contains` filter.


---

## ✨ Pending Features

- [ ] **View count display** — ⚠️ **Entry corrected 2026-07-31.** This previously claimed the `viewCount` DB column existed and that fetch/cron code was written. An audit found none of that was true in any usable sense: `app/api/cron/update-views/route.js` **does not exist in the repo**, no code anywhere referenced `viewCount`, and the column was 0-of-98 populated. The column has since been dropped (see "Dead Code & Schema Cleanup" below). Treat this as **from-scratch work**: add the column, write the YouTube view-fetch, add a cron route, set `CRON_SECRET`, configure cron-job.org, and display in abbreviated format (1.2M, 45K). Note when re-adding: if the column is `bigint`, Prisma returns a JS `BigInt`, which `JSON.stringify` throws on — that would break every route returning video objects unless serialization is handled.
- [x] **Mobile review** — Done 2026-07-27, verified on a real device. See "Mobile Compatibility & QA" section below.

- [ ] **cron-job.org setup** — Needed for daily view count refresh once view counts are enabled. Sign up at cron-job.org, create job pointing to `https://ground-report-sable.vercel.app/api/cron/update-views?secret=CRON_SECRET`, schedule daily.

---

## 💡 Ideas / Backlog

- [ ] **Filter by channel** — Allow users to see all videos from a specific channel by clicking the channel name on a card.
- [x] **Search** — Basic keyword search across video titles. Done 2026-10-28, see "On-site Search" at the end of this file.
- [ ] **"More like this" beat links** — On the featured card, clicking a beat tag could filter the grid to that beat.
- [ ] **Admin: bulk language/tag edit** — Currently tags are edited one video at a time. A bulk-select-and-tag flow would speed up curation.
- [ ] **Admin: sort/filter dashboard** — Admin video list grows long. Filtering by language, beat, or status would help.
- [ ] **Nomination email alert** — When a new suggestion comes in via the public form, send a notification email to the admin.
- [ ] **About section on home page - Translate to Hindi
- [x] **Page footer** — done 2026-10-28 (see "Card Labels, Dates and Footer").

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
- [x] **FINDING: beat filter case-sensitive** — obsolete, see Known Issues above.

---

## 🔒 Admin Security Audit — 2026-07-26

Full review of every `/admin` page, `/api/admin/*` route, and the auth layer (`proxy.js`), prompted by the admin nav/auth cleanup earlier this session.

**Fixed:**
- [x] **Nomination status had zero validation** (`PATCH /api/admin/nominations/[id]`) — any string could be written straight to the DB. Fixed: whitelisted to `pending`/`approved`/`rejected`, invalid values now return 400.
- [x] **Video status had weak validation** (`PATCH /api/admin/videos/[id]`) — old code used a truthy check only (`if (body.status)`), no whitelist, and silently ignored empty strings instead of rejecting them. Fixed: whitelisted to `published`/`hidden`, invalid values return 400.

**Open — real security/robustness items, roughly priority order:**
- [x] ~~Public `/api/nominations` has no rate limit or input length cap~~ — **fixed 2026-07-27**, see "Public Nomination Rate Limiting" section below.
- [x] **Session cookie is the plaintext admin password, not a signed token** — FIXED 2026-10-31 (signed, expiring token; see "Admin Security Polish" at the end of this file). Original note: `admin_session` cookie value literally equals `ADMIN_PASSWORD`. Functional and cookie flags (httpOnly/secure/sameSite) are correct, but there's no way to invalidate one leaked session without rotating the password for everyone. Acceptable tradeoff for a small trusted-editor tool per the comment in `proxy.js`; worth revisiting if the team grows.
- [x] **Timing-unsafe password comparison** FIXED 2026-10-31 (login now compares SHA-256 digests with timingSafeEqual; the cookie check is an HMAC verify). Original note: (`===`) in both `proxy.js` and `/api/auth/login` — low real-world risk for a human-typed password, but not constant-time.
- [x] **No try/catch around `request.json()`** FIXED 2026-10-31 (all routes use a safe reader and answer 400). Original note: across admin API routes — a malformed request body would throw an unhandled 500 instead of a clean error.
- [ ] **YouTube lookup routes' error handling is unpolished** — `lib/youtube.js` doesn't currently leak the API key in errors (checked), but a non-JSON error response from YouTube (e.g. during an outage) would throw an ugly generic error rather than a handled one.
- [x] **`DELETE` on categories/videos doesn't pre-check existence** STALE: both DELETE routes already checked first (found 2026-10-31); now they also handle the race. The real gap was PATCH on a missing id (fixed). Original note: — deleting an already-gone `id` throws a Prisma "not found" error instead of a clean 404. Cosmetic only.

**Confirmed safe (checked, not assumed):**
- No XSS risk anywhere in admin — no `dangerouslySetInnerHTML`, React's auto-escaping covers all rendered user-submitted content (nomination `input`/`reasonText` included). *(Still true for admin. As of 2026-10-11 the public video page uses one escaped `dangerouslySetInnerHTML` for JSON-LD — see below.)*
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
- [x] ~~**`body.region` on the video PATCH route has zero validation**~~ — **resolved 2026-07-31 by deletion rather than validation.** The audit found `region` was never read, never populated (0/98 rows), and collected by no admin form — so both write paths and the column itself were removed. See "Dead Code & Schema Cleanup" below.

**Validated:** both new files (`app/api/auth/login/route.js`, `prisma/schema.prisma`) confirmed deployed byte-for-byte via diff; `LoginAttempt` table live in Supabase with correct schema and RLS; correct commit ("admin login rate-limiter") live in production. Logic re-verified on the live file. Not load-tested with real repeated login attempts (no POST-capable tool available this session) — a manual check would be deliberately mistyping the password 5-6 times on `/admin/login` and confirming the 6th attempt returns "Too many login attempts."

> ⚠️ **Follow-up: that untested caveat mattered.** When the manual test was actually run, the rate limit appeared not to work at all. Two separate bugs were behind it — see "Architecture Review & Course Correction" below. Worth remembering as a general lesson: "deployed and logically correct" is not the same as "verified working."

---

## 🏗️ Architecture Review & Course Correction — 2026-07-28

A deliberate step back to critique the recently-built work rather than add to it. It found two live bugs and reversed an approach that was about to ship.

### The review's main findings

- **The `/api/videos` rate limiter (built, never deployed) was self-defeating.** It added a `COUNT`, an `INSERT`, and a `deleteMany` to every request — **four database operations where there had been one** — in order to defend against a *hypothetical* amplification of database load. Under the exact attack it targeted, it made things worse. It also enforced at the wrong tier: the function had already been invoked and a Postgres connection opened *before* the limit was evaluated, so the expensive part had already happened.
- **It defended a parameter that should simply have been deleted.** `beat` appeared on the homepage only inside `hrefFor(...)`, passed through to preserve state — **no UI element anywhere produced it** (the beat filter chips were removed from the public UI long ago). The correct fix was deleting a vestigial parameter, not building infrastructure around it.
- **Wrong storage tier, now duplicated three times.** Postgres is a poor substrate for rate-limit state (durable and transactional, for data that is ephemeral and disposable). Redis/Upstash or edge enforcement — Vercel's WAF/BotID, which reject *before* a function is invoked — are the conventional choices. Three structurally identical tables and three copy-pasted `getClientIp` implementations had accumulated.
- **The CSP oversells itself.** `script-src 'unsafe-inline'` (required by Next.js App Router's inline hydration scripts) gives up most of a CSP's XSS value. The directives genuinely doing work are `frame-ancestors`, `object-src`, `base-uri`, `form-action`, and blocking third-party script/style origins.
- **Core caching rests on `unstable_cache`** — the name is the maintainer's warning. Next.js 16 has `use cache` with `cacheTag`/`cacheLife` as the stable successor. Worth planning a migration rather than discovering it at an upgrade.
- **No instrumentation.** Every threat addressed recently was inferred from reading code, not observed in traffic. The right sequence is measure → confirm → size the mitigation; skipping to mitigation is how you end up with a limiter costing more than the attack.

### Two live bugs it surfaced in the login rate limiter

- [x] **The attempt-recording write was not awaited.** `prisma.loginAttempt.create(...)` had no `await`, on the reasoning that it "must never block the login." In a serverless runtime the container can be frozen the moment a response is returned, so the write could be killed before reaching Postgres — leaving the counter near zero and **silently disabling the rate limit entirely**. It failed open, with no error anywhere. Fixed by awaiting both the insert and the cleanup `deleteMany` (logins are rare; the latency is irrelevant). The misleading comment that justified the original approach was rewritten so it doesn't invite the same mistake again.
- [x] **The login page hardcoded "Incorrect password" for every failure.** `if (res.ok) {...} else { setError("Incorrect password") }` discarded the server's message, so a `429` "Too many login attempts" was displayed as a wrong password. This masked the first bug and made a *working* limiter look broken. Fixed by reading `data.error` with the old string as fallback.
- **How it was diagnosed:** the `LoginAttempt` table showed exactly 5 rows, one IP, consecutive, all inside the window. That's the precise signature of a *working* limiter — attempts 1-5 recorded, attempt 6 rejected before the write. The data pointed at the UI, not the limiter. Confirmed working end to end after both fixes.

### The homepage package, revised

The four-file package was reduced to three and shipped:

| | Original (not shipped) | Revised (shipped) |
|---|---|---|
| `beat` param | length-capped at 50 chars, kept | **deleted entirely** from homepage and `/api/videos` |
| `/api/videos` | + rate limiter (4 DB ops/request) | no rate limiter |
| New DB table | `PublicApiRateLimit` | none — and the already-created table was **dropped** |
| Security headers | added | added, unchanged |

- [x] `beat` removed from `app/page.jsx` (all 8 references: cached-query parameter, filter, `hrefFor` signature, both pill call sites) and from `app/api/videos/route.js`. `beatTags` remains in the DB and the admin editor — this only removed it as a *public URL filter*.
- [x] `language` kept and length-capped (20 chars) — still honoured so older bookmarked links work, though no UI produces it either. Cheap equality match, unlike `beat`'s substring scan.
- [x] Security headers live in `next.config.mjs`: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- [x] Orphan `PublicApiRateLimit` table dropped from Supabase (verified empty first). Schema back to seven tables, all RLS-enabled.

**Validated:** all three files confirmed deployed byte-for-byte; headers confirmed present on both page *and* API responses; `?beat=paper leak` confirmed inert (returns the full unfiltered list rather than the 3 matching videos); `?category=poetry` confirmed still filtering correctly with the right pill active and clean hrefs — no regression from the changed `getVideos`/`hrefFor` signatures.

**Still worth watching:** `connect-src 'self'` is the CSP directive most likely to break something quietly — check the Vercel Analytics dashboard in a day or two to confirm data is still flowing.

### Carried forward

- [ ] Consolidate rate limiting onto Vercel WAF/BotID or Upstash; retire the duplicated Postgres tables and `getClientIp` copies.
- [ ] Plan the `unstable_cache` → `use cache` migration.
- [ ] Add basic alerting, so the next threat is observed rather than theorized.
- [x] Decide whether `/api/videos` should exist at all — the site itself doesn't consume it (the homepage queries Prisma directly). The most secure endpoint is one that doesn't exist. **Removed 2026-10-27** at the owner's request (also deleted the two unused `public/icon-*.png` files); recoverable from git history.

---

## 🧹 Dead Code & Schema Cleanup — 2026-07-31

A deliberate audit for unused code, columns, and files — prompted partly by the `beat` removal, which orphaned things downstream.

### Method

Rather than eyeballing, each candidate was checked three ways: what the homepage actually reads, what the code references, and what the **data** shows. That last one settled several cases — a column referenced in code but empty in all 98 rows is dead regardless of what the code implies.

### Removed

- [x] **`Video.region` column** — 0 of 98 rows populated. Never read by the homepage, public API, or admin UI. **No admin form collected it** — neither add page had a region input. Yet it had *two* write paths (`POST /api/admin/videos` and `PATCH /api/admin/videos/[id]`). Both paths removed, column dropped.
- [x] **`Video.viewCount` column** — 0 of 98 rows non-zero, **zero code references anywhere**, and absent from `prisma/schema.prisma` entirely. This was live **schema drift**: had anyone run `prisma migrate dev`, Prisma would have generated a migration to drop it as an unknown column. Dropped deliberately instead.
- [x] **`app/BeatFilters.jsx`** — orphaned client component rendering the old beat filter chips, with an internal `hrefFor` building `?beat=` URLs — the exact parameter deleted the day before. Nothing imported it; the only file mentioning "BeatFilters" was itself. Verified it was the sole user of no CSS class, so deleting it stranded nothing.

### Verified clean — no action needed

- **CSS**: all 21 classes in `globals.css` are genuinely referenced. No dead styles.
- **Homepage code**: every import (`prisma`, `unstable_cache`, `Link`) is used, and every declared function (`timeAgo`, `hrefFor`, `getCategories`, `getHero`, `getVideos`, `FeaturedCard`, `StoryCard`) is called. **No dead code in `page.jsx`** — the waste was all in the schema and that orphaned component.
- **Full DB drift audit, all seven tables**: `Channel`, `Nomination`, `Category`, `VideoCategory`, `NominationRateLimit`, `LoginAttempt` all match the Prisma schema column-for-column. `viewCount` was the single drift point in the entire database.
- **`beatTags`**: 98/98 populated, actively used by admin tagging. Keep.
- **`language`**: 98/98 populated. No UI produces `?language=` anymore, but it's deliberately kept working for old bookmarked links — vestigial *by choice*, not by accident.
- **`Channel.lastBrowsedAt`**: genuinely used by the channel-browse flow.
- **`/admin/add` vs `/admin/add-video`**: previously flagged as possible duplicates — they're not. Distinct purposes (channel vs video), both linked in the nav.

### A near-miss worth recording

The first version of this cleanup **added `viewCount BigInt @default(0)` to the schema** to resolve the drift non-destructively — described at the time as safe. It was not. Prisma returns a JS `BigInt` for a `bigint` column, and `JSON.stringify` throws on `BigInt`. Four routes serialize video objects: `GET /api/videos`, `GET /api/admin/videos`, `POST /api/admin/videos`, and `PATCH /api/admin/videos/[id]`. Pushing it would have 500'd **the entire admin video management UI plus the public API**. Caught before deploy only because a check of `main` revealed the push hadn't happened yet. Dropping the column was the correct resolution.

### Sequencing (this mattered)

Columns were dropped **only after** the code deploy, never before. The live Prisma client had `region` in its schema and selected it on every video query — dropping the column first would have 500'd the homepage instantly. Order was: deploy code → confirm the live API response no longer contained `region` → then drop. Verified healthy before and after.

**Final state:** `Video` is 11 columns, matching the Prisma schema field-for-field. **Zero drift across the entire database.**

### Still outstanding

- [x] **~40 `*_old*.jsx` / `*_old*.js` backup files** — removed 2026-10-27 (27 tracked files, nothing referenced them). Original note: still in the repo. Next.js ignores them entirely (they don't match its routing filenames) so they can't affect the running site, but they make it materially harder to tell what's current — which matters now that dead-code audits are a recurring activity. Deliberately held back as a separate commit: largest diff, least consequence.

---

## 🔍 SEO Technical Foundation — 2026-08-01

An audit prompted by a beat-tags feature idea (parked — see below), which surfaced that the site had no SEO infrastructure at all. Full pass shipped and verified live.

### Audit findings

- [x] **No `robots.txt`, no `sitemap.xml`, anywhere.** Confirmed via a full repo tree search — neither existed in any conventional location, nor did a `public/` folder.
- [x] **No Open Graph or Twitter Card tags on any page.** Sharing any link showed a bare URL with no preview.
- [x] **No `metadataBase` or canonical URL config.** Minor duplicate-content risk given both `peoplelens.in` and `www.peoplelens.in` resolve live.
- [x] **No favicon.** `favicon.ico` returned Next.js's own 404 page.
- [x] **`/suggest` had no metadata at all** — it's a client component (`"use client"`), which structurally cannot export `metadata`. It was silently inheriting the homepage's generic title/description.
- [x] **Structural ceiling confirmed, not assumed:** pulled the full route table. Exactly four public routes exist — home, about, suggest, and home's own `?category=`/`?language=` filter states. No `/video/[id]`, no `/category/[slug]`. Sitemaps and structured data can only be as good as what they point to.

### Shipped

- [x] **Favicon** — designed 3 concepts (red square, blue lens mark, red circle), tested each at true 16px render size before choosing. Blue lens mark rejected at that stage: legible at full size, degraded to a fuzzy dot at 16px. Shipped: signal-red circle, lowercase serif "p" (`app/favicon.ico`, plus `public/icon-192.png` / `icon-512.png` for future manifest use).
  - Near-miss during rollout: `app/suggest/page.jsx` (the actual form) went missing from `main` between being reviewed and being pushed — cause unknown, not something this session's edits touched. `layout.jsx` alone doesn't render a route; Next.js correctly 404'd. Caught during validation, restored from the last-known-good fetch, confirmed working after redeploy.
- [x] **`app/robots.js`** — allows `/`, disallows `/admin` and `/api/`, links the sitemap.
- [x] **`app/sitemap.js`** — home, about, suggest, plus one entry per category with actual published content (mirrors the same "hide empty categories" rule the homepage's filter pills already use). Honest limitation: category entries are `?category=slug` query strings, not clean paths — because clean category routes don't exist yet. Best available option on the current architecture, tied directly to the parked structural decision below.
- [x] **`metadataBase` + site-wide OG/Twitter defaults** added to the root layout.
  - Caught before shipping: an initial draft added a `title.template`, which would have retroactively wrapped every page's own already-correct title — including `/admin`'s specifically-ordered "PeopleLens - Admin". Reverted to a plain default title; every existing page title is untouched.
- [x] **`/about` and `/suggest` given their own OG/Twitter overrides**, so sharing those links shows their own title, not the homepage's. `/suggest`'s fix required a new `app/suggest/layout.jsx` (server component) since the page itself can't carry metadata — same technique as the earlier admin-layout split.
- [x] **OG share image** (`app/opengraph-image.png`, 1200×630) — designed 3 concepts (full red, split-panel, quiet paper+badge), chosen for legibility when crushed down to real feed-thumbnail size, not just at full resolution. Shipped: split panel, red "p" mark left, wordmark + tagline right. Twitter card type upgraded from `summary` to `summary_large_image` to match.

### Validated

Every item above confirmed live via direct fetch/diff against what was written, correct commit deployed each time, and the actual rendered `<head>` output checked (not just that files existed) — `og:image` dimensions, `twitter:card` type, per-page title/description all confirmed correct on `/`, `/about`, and `/suggest`.

### Parked — deliberate, not forgotten

- [ ] **Real category routes (`/category/[slug]`).** (Individual video pages shipped 2026-10-11; category routes are still open.) The actual structural fix for the sitemap's query-string limitation, and a prerequisite for `VideoObject` structured data / rich results. Genuine multi-file feature: new routes with `generateMetadata()`, a content decision (embed-only is "thin content" per Google's own guidance — likely needs at least a short curator note per video), sitemap rework, and a change to how homepage cards link out (currently straight to YouTube). Deliberately not backed into as a side effect of this pass.
- [ ] **Beat tags → structured, searchable entities.** The feature idea that started this whole audit. Current `beatTags` is a single free-text `String?` column, admin-only, unused everywhere else in the app — confirmed by full code trace. Real decision needed: own table (mirroring `Category`), fold into `Category` itself, or a native Postgres array. Deliberately kept (not deleted) specifically because this discussion named a plausible future use for it — unlike `region`/`viewCount`, which had none.

---

## 📊 Speed Insights Rollout — 2026-08-02

Merging the long-dormant Vercel bot PR (see Known Issues, resolved above) turned into a genuine multi-round debugging exercise — logged in full because the failure mode is worth remembering, not just the fix.

### What went wrong

- [x] **The bot's PR was built against a stale `layout.jsx`** — from before the container-width change (`max-w-3xl` → `max-w-6xl`) and padding adjustment made earlier in the project. Merging it didn't cleanly reconcile the two versions.
- [x] **GitHub auto-merged without conflict markers — and still produced broken JSX.** No `<<<<<<<`/`=======`/`>>>>>>>` appeared, which looked like success, but the merge left two `<main>` tags, a duplicated `<Analytics />`, a `<SpeedInsights />` indented with raw tabs, and a `</body>` closing in the wrong place — all sitting in the file as invalid JSX. **Lesson: "auto-merged, no conflicts" is not the same as "merged correctly."** Git can silently combine non-overlapping line ranges into a structurally broken result.
- [x] **The same corruption reappeared three times** across this rollout, each after a fix had been applied and confirmed correct in isolation — because each new `git pull` re-triggered the same automatic (and wrong) merge resolution between local and remote history. A local edit/push cycle could not break the loop on its own.
- [x] **`package.json` had a real, separate merge conflict** (this one *did* show markers) — local guessed `@vercel/speed-insights: ^1.1.0`, the bot's actual PR specified `^2.0.0`. Resolved by keeping the bot's real version rather than the guess.
- [x] **Installing the package and rendering the component was necessary but not sufficient.** Even with fully correct code confirmed live and bundled (verified via the page's React Server Components manifest), the Speed Insights dashboard still showed the "Get Started" onboarding screen. Root cause: Vercel has a **separate project-level activation step** — `POST /speed-insights/toggle` in their API, or `vercel project speed-insights` via CLI, or an Enable button in the dashboard — independent of the code being present at all.

### How it was actually resolved

- [x] Repeated local pull/push cycles kept reproducing the corruption. **Broke the loop by editing `app/layout.jsx` directly in GitHub's web UI** — full select-all, delete, paste the correct content, commit straight to `main`. That bypassed whatever was going wrong in the local git state, and the fix finally held.
- [x] `package.json` conflict resolved by keeping the bot's real `^2.0.0`, confirmed via `git status`/conflict markers rather than assumption.
- [x] Verified the code fix independently at each step: raw-content diff against what was written, aggressive cache-busting to rule out stale reads, and `state: READY` on the actual Vercel deployment — not just "the file looks right."
- [x] Found and flipped the separate dashboard/API activation step. Confirmed working: real Core Web Vitals data now visible in Speed Insights.

### Why this matters going forward

This closes the "no instrumentation" gap flagged in the Architecture Review (2026-07-28) — every performance claim since then had been inferred from code or logs, never observed in real traffic. That's no longer true for Core Web Vitals specifically.

**Worth remembering if a bot-generated PR ever surfaces again:** check what base commit it was built against before merging — a PR sitting unmerged for a while is likely stale relative to `main`, and merging it may silently corrupt whatever file it touches even without triggering a visible conflict.

---

## 📈 Admin Stats Section — 2026-08-23

New "Stats" tab added to the admin nav, alongside the existing Published Videos / Suggested Videos / Add video / Add channel / Categories tabs.

### What it shows

- **Header cards**: total videos, published, hidden, featured, channel count
- **Curation activity chart**: videos added per day, plain inline SVG bar chart, toggleable between 30 days / 90 days / 1 year (default 30, days backfilled to zero rather than skipped so gaps aren't misrepresented as a compressed timeline)
- **Top sources**: horizontal bar chart, top 12 channels by video count
- **Categories** and **language** breakdowns, same horizontal-bar treatment
- **Suggestions**: pending / approved / rejected counts

### Design decisions

- [x] **No new database tables or columns.** Everything needed (`addedAt`, `publishedAt`, channel relation, category relation, language) already existed. Pure read-only aggregation via `groupBy`/`count` against existing tables — retroactively covers full history (188 videos at build time), not just data going forward.
- [x] **No charting library added.** Given the `package.json` merge-conflict saga from the Speed Insights rollout, deliberately built the chart as plain inline SVG rather than pulling in a new npm dependency — nothing to version-pin, nothing that can produce a install-time merge conflict.
- [x] **Already covered by existing auth.** `proxy.js`'s wildcard matchers (`/admin/:path*`, `/api/admin/:path*`) automatically protected the new routes — no changes needed there.

### What went wrong during rollout — a new, distinct failure mode

Unlike prior incidents (stale PR merges, missing dependencies), this was a **file-placement mistake**, not a code or Git-history problem:

- [x] **The new `page.jsx` was saved to `app/api/admin/stats/page.jsx` instead of `app/admin/stats/page.jsx`** — two visually similar but structurally different folder trees (`app/admin/` for UI pages, `app/api/admin/` for API routes) that share the same final segment name (`stats`), making the mistake easy to make when creating brand-new nested folders locally.
- [x] **Next.js's build error was precise and correctly diagnostic**: *"Conflicting route and page at /api/admin/stats: route at /api/admin/stats/route and page at /api/admin/stats/page"* — a folder can be an API route or a page, not both. The error pointed directly at the cause.
- [x] **First fix attempt was incomplete**: a correct copy of the page was created at the right path, but the wrong copy was left in place rather than deleted, so the collision persisted. Confirmed via diff that both copies had identical content — pure duplication, no risk in deleting the stray one.
- [x] Resolved by deleting `app/api/admin/stats/page.jsx` directly on GitHub, leaving `route.js` alone in that folder and `page.jsx` alone in `app/admin/stats/`.

**Lesson for next time a new nested route is added:** double-check the full path, not just the filename, before creating new files — `stats` under `app/admin/` and `stats` under `app/api/admin/` look identical at a glance but are not interchangeable.

### Validated

File structure confirmed correct via direct fetch (route.js present alone, page.jsx present alone in the correct folder, stray duplicate gone, nav link present). Vercel's own deployment-status API was intermittently unavailable during validation (transient connector issue, unrelated to the site itself) — final confirmation came from an independent fetch of the live homepage (full content, correct metadata) plus the user directly confirming the Stats page renders correctly when logged in.

---

## 🔒 Public-Surface Security Review & Dependency Upgrade — 2026-08-24

An adversarial review of the public homepage ("how would someone actually compromise this?"), plus the resulting fixes.

### Fixed

- [x] **`?category=` was unvalidated, allowing unbounded cache-key growth.** `getVideos()` is `unstable_cache`-wrapped and keyed on its arguments, so every distinct `?category=` value minted a new cache entry *and* a fresh DB query. Anyone could script `/?category=<random>` to force unlimited entries — the homepage has no rate limiting (deliberately, to avoid throttling real visitors). **Fixed by whitelisting** against the real category list (`getCategories()` already runs first), bounding the key space to the ~21 categories that actually exist. Invalid values now fall back to the unfiltered feed rather than an empty grid.
  - **This was a repeat of the `beat` amplification issue** solved earlier by deleting `beat`. When `category` was assessed at that time it was waved through as "a cheap indexed lookup" — which addressed *query cost* but missed *cache-key growth*, the actual core of the problem. Same flaw, second occurrence.
- [x] **Next.js 16.2.10 → 16.2.11** — closes 9 published CVEs (4 high, 5 medium) from the July 2026 release. Pinned with `--save-exact` (no caret) so `npm audit fix` can't silently drift the version again.

### Assessed and deliberately accepted

- **3 remaining npm advisories** (`postcss` ×2, `nanoid`, `sharp`): `postcss`/`nanoid` are build-time only and never run at request time; `sharp`'s image-parsing CVEs are gated behind `next.config.mjs`'s `remotePatterns` allowlist (three YouTube domains), so an attacker can't feed it their own image. **Do not run `npm audit fix --force`** — it resolves these only by jumping to 16.3, which is unvalidated here.
- **Which July CVEs actually applied:** checked each against real feature usage. The most dangerous — a *middleware/proxy bypass that would defeat `proxy.js` and expose `/admin` unauthenticated* — requires an `i18n.locales` config this app doesn't have. SSRF and Server Action issues also didn't apply (no `rewrites()`, no `"use server"`, Vercel-hosted). That was luck, not design.

### ⚠️ Local Windows builds fail — this is expected, do not chase it

`npm run build` fails locally with `Error [InvariantError]: Invariant: Expected workStore to be initialized. This is a bug in Next.js.` — **on every version tested: 16.2.10, 16.2.11, and 16.3.2.**

Key evidence it's environmental, not a code or version problem:
- **16.2.10 — the exact version then running fine in production — also fails locally.** This was the decisive test.
- Each run fails on a *different* page (`/admin/add-video`, `/_global-error`, `/_not-found`), i.e. non-deterministic — pointing at the parallel prerender workers, not any page's code.
- Two of those three are Next.js's own internal error boundaries, not app code.
- Next.js labels it "a bug in Next.js" in the error text itself.
- Vercel's Linux builds succeed consistently.

**Lesson:** when a build breaks right after a version bump, establish a baseline on the *known-good* version before assuming the bump caused it. Attributing the first failure to the 16.3 upgrade cost several rounds of unnecessary version-juggling.

### Also noted

- **16.3.2 was reached accidentally** via `npm audit fix` (a *minor* bump, not the patch-level change expected). Reverted. Worth knowing `audit fix` can move minors.
- **August 26 release targets 16.3 and 15.5, not 16.2** — so a deliberate 16.3 migration will be needed to receive it, ideally re-testing the prerender behaviour at that point.
- [x] **Apex→www 308 redirect appears to strip query strings** — checked 2026-10-27: `peoplelens.in/about?x=1` → 308 to `www.peoplelens.in/about?x=1`, query string kept. Not reproduced (tested on `/about`; `/?category=` not tried). Original note: `peoplelens.in/?category=poetry` may lose the filter while `www.peoplelens.in/?category=poetry` works.

### Verified clean (checked, not assumed)

No raw SQL anywhere (`$queryRaw`/`$queryRawUnsafe` absent — all Prisma parameterized); no XSS surface (as of 2026-08-24: `dangerouslySetInnerHTML`/`eval`/`innerHTML` absent — **superseded 2026-10-11: one escaped JSON-LD use now exists on `/video/[id]`, see below** — and every `href` built via `URLSearchParams` resolving to relative paths, so no `javascript:` injection); no open redirect (only `window.location` assignment is a hardcoded `"/"`); no mass assignment (no `...body` spreads); no secrets in the client bundle (no `NEXT_PUBLIC_` vars, no `process.env` in any client component); `status: "published"` enforced on all homepage queries, the public API, *and* the sitemap.

**CSP caveat:** `script-src 'unsafe-inline'` is required by Next's App Router hydration, which means the CSP provides **almost no XSS protection**. Fine today since no XSS vector exists, but it is not a safety net if one is ever introduced.

---

## 🔎 Discoverability Review & On-Page Fixes — 2026-08-25

A search-results reality check ("what actually shows up if someone searches for this"), which surfaced a real strategic problem alongside two small, genuinely useful technical gaps.

### The big finding — not fixable with code

- **Searching "PeopleLens" returns none of this site.** It returns **Microsoft Research's own "PeopleLens"** (an AI accessibility project, covered by TechCrunch/WinBuzzer/ACM) and **peoplelens.ai**, an established sales-intelligence SaaS company with LinkedIn/Crunchbase/podcast presence. Both have far more domain authority than a new site can realistically out-rank for that exact term, likely ever.
- **Implication:** stop optimizing for the brand name — nobody searching "PeopleLens" is looking for this site anyway — and optimize for what the site actually covers (India, ground reporting, specific beats). This directly shaped the title/description rewrite below.
- **PARI (People's Archive of Rural India)** surfaced as a directly comparable, established Indian independent-journalism site with a Wikipedia page — a plausible benchmark and backlink/community target, not previously identified.

### Fixed

- [x] **Homepage had zero heading tags.** No `<h1>`, `<h2>`, or `<h3>` anywhere — the tagline and the "Category" label were both plain styled `<p>`/`<div>`. This is one of the strongest on-page signals Google uses to determine page topic, and it was entirely absent. Fixed: tagline → `<h1>`, "Category" label → `<h2>` (with `fontWeight: 400` added to counter the browser's default heading bold, so the visual result is unchanged). Also an accessibility win — screen readers navigate by heading structure.
- [x] **Title and description were brand-only, containing zero topic keywords** — no "India," no beat names, no language. Given the brand-collision problem above, a brand-only title was close to the worst option: competing on an unwinnable term while signalling nothing about winnable ones. Rewrote to `"PeopleLens — Independent Ground Reporting from India"` with a description naming India, specific beats (education, corruption, infrastructure, protests), and both languages. Added a `keywords` meta array. OG/Twitter tags updated to match.

### Validated

Both files confirmed deployed byte-for-byte via diff. Live homepage fetch confirmed: `<h1>` and `<h2>` present and correctly ordered, title/description/keywords/OG/Twitter all showing the new copy, full video feed and all 21 category pills rendering normally — no regression from the markup change.

### Not fixed here — deliberately out of scope for a code change

- [ ] **Backlinks** — still the largest actual lever, and entirely non-technical. PARI and the channels already featured on the site are the most natural starting points.
- [ ] **Real category routes** (video pages shipped 2026-10-11) — unchanged from prior assessment; still the structural ceiling on ranking depth.

---

## ⬆️ Tech Upgrade Audit — 2026-10-07

A dependency/runtime check against what is current as of October 2026. Conclusion: **one upgrade is worth doing soon (Next.js), one platform setting to verify (Node), everything else deliberately deferred.**

### Current state (from `main`)

| Package | Pinned / resolved | Latest | Verdict |
|---|---|---|---|
| next | 16.2.11 (exact) | 16.4.0 (16.3.8 = patched LTS) | **Upgrade soon** |
| react / react-dom | ^18.3.1 | 19.3.0 | Defer (optional) |
| @prisma/client / prisma | ^5.20.0 → 5.22.0 | 7.10.0 (8.0 RC out) | Defer (major migration) |
| tailwindcss | ^3.4.13 → 3.4.19 | 4.3.3 | Defer (rewrite, no user-visible gain) |
| @vercel/analytics | 2.0.1 | 2.0.1 | Current |
| @vercel/speed-insights | 2.0.0 | 2.0.0 | Current |
| postcss / autoprefixer / sharp | 8.5.23 / 10.5.4 / 0.34.5 | — | Fine (earlier accepted advisories stand) |

### Next.js — why 16.2.11 is now behind

- **Sept 22 out-of-band (16.3.6):** critical RCE in Node `ImageResponse` (`next/og`), GHSA-vcvr-r3jv-pc5j, affects `>=16.2.0 <16.3.6`. **Not applicable here** — the app has no `ImageResponse` / OG-image route (`app/opengraph-image.jsx` is 404; OG tags are static metadata). Re-verify if an OG-image route is ever added.
- **Sept 30 release (16.3.8 / 15.5.27):** seven fixes — image-optimizer SSRF (high, 16.x), two cache-poisoning bugs (medium, 15.x/16.x), metadata-image `dynamicParams` bypass (medium, 16.x), Draft Mode / `use cache` leak (16.3.x only), dev-only MCP disclosure (low). **Relevant to us:** the SSRF and cache-poisoning items touch 16.x; the app uses `images.remotePatterns` (YouTube hosts only), which limits but doesn't remove exposure.
- **Still open upstream:** two further issues (one critical, one high) were deferred pending upstream coordination — expect another bump when they ship.
- **Target: `next@16.3.8` pinned exactly** (Active LTS). 16.4.0 is one day old; wait for a patch release unless a reason emerges.
- Past lessons apply: 16.3.2 "failed" locally only because the Windows local build is environmentally broken (16.2.10 fails identically). **Validate on a Vercel preview, not locally.** Do not use `npm audit fix --force`.

### Node.js on Vercel

- Vercel **disabled Node 20 on 2026-10-01**. Existing deployments keep running; **new deployments fail** if the project is still on 20.
- [x] Verify Project Settings → Node.js Version is 22.x or 24.x (done 2026-10-27: 24.x). Setting `engines` in `package.json` is still optional and open.

### Deferred, with reasons

- **React 18 → 19:** Next 16 supports both; nothing forces it.
- **Prisma 5.22 → 7.x:** major migration; current pooling/RLS/direct-connection setup works and no security driver identified. Revisit alongside schema work.
- **Tailwind 3 → 4:** config + CSS rewrite for no visible benefit.

### Action list

- [x] Verify Vercel Node version is not 20 (done 2026-10-27: 24.x)
- [x] ~~Bump `next` to exactly `16.3.8`~~ — superseded: upgraded to 16.4.1 on 2026-10-28 (see "Next.js 16.4.1 Upgrade" at the end of this file).
- [ ] Re-check for the next Next.js security release (two issues still pending upstream)

Sources: nextjs.org/blog (upcoming-nextjs-security-release-september-2026; nextjs-security-update-september-22-2026), Netlify changelog 2026-09-30, Vercel changelog "Node.js 20 is being deprecated".

---

## 🧭 Feature Roadmap — Competitive Review — 2026-10-11

A review of the live site against comparable products to find upgrade opportunities. **Core finding:** every card sends the visitor straight to YouTube, so PeopleLens has almost no pages of its own to rank, share or show its curation on. Most of the high-value work below fixes that.

### Current public surface (as audited)

Homepage only: featured story, grid of ~100 videos, 22 category pills (top 8 + "More"), About page, "Suggest a video" form (`/suggest`). Cards show title, channel and relative age, and link out to YouTube. **Absent:** search, paging/"load more", footer, channel pages, category labels on cards, absolute dates, public language filter, per-video pages.

### Comparable products

| Product | Notable features | Takeaway for PeopleLens |
|---|---|---|
| Ground News | Multi-outlet story view, weekly "Blindspot" report, bias/factuality ratings, freemium | Borrow the "stories ignored by one side / by TV" angle; **skip** bias ratings |
| PARI | ~26 categories, FACES project by place, translations in 12+ languages, education resources, library | Borrow place-based browsing and bilingual pages |
| Newslaundry (NL Sena) | Readers fund specific stories with budgets shown | Borrow as "support this journalist" links that pay them directly |
| Dailyhunt / Inshorts | Many Indian languages; very short summaries | Partly: a short curator's note per video |
| YouTube | Recommendation algorithm, subscriptions | The thing PeopleLens is the alternative to |

Context: Indian journalists moving to YouTube report that view revenue doesn't cover reporting costs and crowdfunding culture is weak. Their reporting does have real-world impact (e.g. a no-water village got state tankers within a day).

### Tier 1 — Foundations (do first, mostly small)

- [x] **Per-video pages** (`/video/[id]`) — *shipped 2026-10-11, see the section below.* Original spec: `/video/[id]`: embedded player (`youtube-nocookie.com`, needs CSP `frame-src`), curator's note, category tags, date/place, related stories. Biggest SEO and shareability gain.
- [ ] **Channel pages** (`/channel/[slug]`): all curated videos from one journalist, YouTube subscribe link, support links.
- [ ] **Real category routes** (`/category/[slug]`) replacing `?category=`. Indexable, and sidesteps the open apex→www query-string-stripping issue.
- [x] **Search** across title, channel and category (Postgres full-text; no YouTube API quota). Shipped 2026-10-28, see "On-site Search" below.
- [x] **"Load more" / paging.** Single page with 100+ videos keeps growing.
- [x] **Category label + absolute date on cards**; the parked **footer**. Shipped 2026-10-28, see "Card Labels, Dates and Footer" below.
- [ ] **Hindi / English toggle** (language data already stored).
- [ ] **RSS feed** (`/feed.xml`).

Note: video, channel and category pages share the same plumbing (dynamic routes, metadata, sitemap entries) — build them together.

### Tier 2 — Differentiators

- [ ] **"Why this matters" curator's note** (1–2 lines per video) — makes the curation visible.
- [ ] **"Under-reported" badge/section** for stories mainstream TV skipped (admin flag; PeopleLens's version of Blindspot).
- [~] **Browse by place** — the `place` field now exists and is filled on add (see Place Suggestions, 2026-10-11); a public state filter / map is still to do. Original idea: state/district tag per video → state filter → later an India map.
- [ ] **Story threads + impact notes**: link follow-ups on the same issue and record outcomes.
- [ ] **Support this journalist**: UPI / membership / Patreon links on channel pages (money goes to them directly).
- [ ] **Weekly digest**: email and/or WhatsApp Channel.
- [ ] **Public suggestion credit + status**: "Suggested by a reader"; let suggesters see if theirs was accepted.

### Tier 3 — Admin & curation quality

- [ ] **New-upload review queue**: daily Vercel cron (Hobby allows one) pulls latest uploads from followed channels into a review list; nothing goes live without approval.
- [x] **Dead-video checker**: detect deleted/private videos. — shipped 2026-10-11 as Admin → Link check; first run: all 233 available. See section below.
- [ ] **Email alert on new suggestions**; **bulk edit** for categories/tags (both previously in backlog).

### Tier 4 — Bigger bets (later)

- [ ] Bookmarks via browser local storage (small); follow channels/categories needs accounts (large).
- [ ] Installable PWA with push for new featured stories.
- [ ] AI-drafted summaries from YouTube captions (incl. Hindi↔English), curator-approved.
- [ ] Public transparency page (most-covered issues this month, share of reader-suggested videos).

### Deliberately not recommended

- **Bias / factuality scores** — needs a ratings system one person can't defend.
- **Comments** — ongoing moderation burden.

### Suggested order

1. Video + channel + category pages → 2. Search + paging → 3. Curator's note + under-reported badge.

Sources: Wikipedia (Ground News; People's Archive of Rural India), Newslaundry "NL Sena: For the Love of Independent Media", CS Monitor "Why some Indian journalists are trading newsrooms for YouTube".

---

## 🎬 Video Detail Pages & Link Check — 2026-10-11

### Shipped: per-video pages (`/video/[youtubeVideoId]`) — validated live

Roadmap Tier 1 item #1. The biggest structural gap from the competitive review: every card used to leave the site for YouTube, so PeopleLens had almost nothing of its own to rank, share, or show its curation on.

- **Page (Option B, article layout):** title, channel · date · place, category tags, embedded player (`youtube-nocookie.com`), curator's "Why this matters" note (label switches to Hindi for `language = hi`), "Watch on YouTube →" + "Copy link", channel card (links to the channel on YouTube — there are no channel pages yet), four related stories (same-category first, topped up with newest).
- **Data:** two nullable columns on `Video` — `curatorNote` (≤1000 chars) and `place` (≤100 chars); ~0.2–0.7 KB per video, negligible against the 500 MB free tier. Added in Supabase first (`ALTER TABLE ... ADD COLUMN`), code deployed after, so the live site was never exposed to a missing column. Edited in Admin → Published Videos (saved on blur through the existing PATCH route, which now validates type and length server-side). Published videos get a "View page" button.
- **Homepage:** layout unchanged. Grid cards now link to `/video/…`; the featured hero deliberately still links straight to YouTube.
- **SEO:** per-page title/description/canonical/OG/Twitter, `VideoObject` JSON-LD, and every published video in the sitemap (`revalidate = 3600`, so new videos appear without a redeploy). Hidden/unknown/malformed IDs return 404 with `noindex`.
- **Caching:** `unstable_cache` tagged `videos` (already revalidated by every admin write). A miss **throws inside** the cached function so random `/video/<anything>` URLs can't mint cache entries — same concern as the homepage category whitelist.
- **CSP:** added `frame-src https://www.youtube-nocookie.com`.

**Validated live:** player embeds and renders; `frame-src` present in the live CSP; canonical/OG image/JSON-LD correct; unknown and malformed IDs → 404; homepage grid cards → `/video/…`; sitemap has 233 video URLs (257 total); all eight files on `main` byte-identical to what was built; admin note/place fields tested by Pankaj. **Not testable live:** hidden-video 404 (all 233 videos are published) — passed in a local build against a stubbed database.

**Security note:** the JSON-LD block is the first `dangerouslySetInnerHTML` in the codebase. It serializes server-side data and escapes `<` as `\u003c`, so a title or note cannot close the script tag, but the earlier "no `dangerouslySetInnerHTML` anywhere" statements are no longer literally true (annotated above).

### Corrected finding: the homepage hides 133 videos

Earlier in this review I assumed ~130 of the 233 videos were hidden because the homepage shows ~100. **Wrong** — all 233 are `published`. The homepage query is capped at `take: 100`, so the 133 oldest videos are reachable only through the sitemap, search engines, and related-story links.

- [x] **"Load more" / paging on the homepage** (roadmap Tier 1 #5, done 2026-10-11) — now more pressing, since the cap silently drops older stories from the main feed.

### Dead-video checker — shipped and run

Admin → Link check (`POST /api/admin/check-videos`): batches `videos.list` (1 quota unit per 50 videos), flags videos that are deleted, private, upload-failed/rejected, or blocked in India, and offers Verify / Hide / Remove per row. Read-only by design — nothing is hidden automatically. If YouTube errors (quota/key), it reports the failure rather than flagging the whole catalogue.

- [x] **`link-check/page.jsx` was pushed to `app/api/admin/link-check/` instead of `app/admin/link-check/`** (nav link 404'd; same class of mistake as the stats page in August). Moved with `git mv`; page now loads from the admin nav.
- [x] **First run, 2026-10-11 15:41 IST: 233 videos checked, all available.** ~5 quota units used.
- [ ] Re-run periodically (e.g. monthly) — videos get deleted/privated over time. A scheduled run with an alert would need a destination for the alert (not built).

### Also confirmed on `main` since the last update

- 60-day option in Admin → Stats (`RANGE_OPTIONS`).
- `lib/youtube.js`: fixed `getChannelVideos` returning `data.nextPageToken` instead of `data2.nextPageToken` (would have thrown a ReferenceError when browsing a channel's videos).
- Category "More" toggle and hero/grid layout fixes (shipped earlier; logged here for completeness).

### Still open

- [x] **Homepage "load more" / paging (done 2026-10-11, see below)** — the homepage is capped at 100 of 233 videos (see corrected finding above). Highest-value next item.
- [x] Next.js 16.2.11 → **16.4.1** — done 2026-10-28, see "Next.js 16.4.1 Upgrade" at the end of this file. (Target changed 2026-10-22; was 16.3.8.) Original note: parked by owner, not urgent but do within a week or two. A 14 Oct out-of-band release (16.4.1) fixes three further issues that 16.3.8 does not include; none appears to apply to this app (see "Next.js Security Re-check" below). Test with a local build before pushing.
- [x] Verify Vercel Node version is not 20 (done 2026-10-27: 24.x).
- [x] Apex→www redirect appears to strip query strings (checked 2026-10-27: query string kept on `/about?x=1`).
- [ ] Channel pages and real `/category/[slug]` routes (roadmap Tier 1) — the video page's channel card currently links out to YouTube.
- [ ] Suggest places for the existing videos — **built, parked by owner 2026-10-11, not pushed.** Package `place-backfill.zip` (Admin → Places: scan, review/edit, save; never overwrites an existing place; no SQL needed). See "Place Suggestions on Add" below.
- [ ] Admin "export notes" button — deliberately deferred; curator's notes live only in Postgres, so revisit once a meaningful number are written.
- [ ] Possibly delete the paused duplicate Supabase project "GroundReport" (Tokyo) if unused.

---

## 📍 Place Suggestions on Add — 2026-10-11

When adding videos, the **Place** field is now pre-filled with a suggestion the admin can edit or clear before publishing. Motivation: place is useful on the video page and for a future state filter, and typing it by hand for every new video is friction.

- **What it uses (no AI, no network, no extra quota):** a creator-set YouTube recording location if present, else a keyword match on the title, else on the first 300 characters of the description. The match list is all Indian states/UTs plus ~75 major cities, in English and Hindi, in `lib/places.js`. A city yields "City, State"; otherwise the state. Earliest mention wins.
- **Hindi words deliberately NOT matched** because they are ordinary words in headlines: "गया" (went), "पुरी" (whole), "सूरत" (face), "कोटा" (quota); Latin "Puri" likewise. Latin "UP" is case-sensitive so "up" never matches.
- **Add video:** Place box under the video with a note ("Suggested from the video details — edit or clear it…" / "No place found…"). **Add channel:** a per-video place box on every row, seeded from the suggestion; typed edits survive "Load more".
- **Saved through** `POST /api/admin/videos` (per-video `place`, trimmed, capped at 100 chars, non-text → null). `lookupVideo` now also requests `recordingDetails` (same single quota unit).
- **Safe by design:** it only suggests — nothing is saved that the admin has not seen.

**Validated:** unit-tested on 19 sample titles (Hindi and English, including the false-positive traps above); helpers tested against a mocked YouTube API; compiled in a scratch Next build; all five files on `main` byte-identical to what was built. **Live test by Pankaj (2026-10-11):** the newest video added got "Delhi" — saved correctly (confirmed in the database).

**Known limits:** a village/district not in the list gets no suggestion; with two places in one title the first wins; description matching can pick up a channel's home city (hence review before publishing).

- [ ] **Optional: "suggest places for existing videos"** — a one-off admin action that fills only *empty* places and shows a list to approve before saving anything. Two older videos (e.g. one titled "Delhi में 10 October को हुए Protests…") have no place because they were added before this shipped.
- [ ] Add more cities/districts if suggestions miss often (send misses and the expected place).

---

*Last updated: 2026-10-11*

## ➕ Homepage "Load more" — 2026-10-11

**Problem:** the homepage was capped at `take: 100`, so the 133 oldest of 233 videos were reachable only via sitemap, search engines and related links.

**Built:** the page now renders the first 50 cards (hero excluded) and a full-width "Load more stories" button; each click fetches the next 50 from a public `GET /api/feed?offset=N` and appends them. Language and category filters carry through.

- **Files:** `lib/feed.js` (cached `getFeedPage`, `getCategories`, `getHero`), `app/api/feed/route.js`, `app/StoryCard.jsx` (shared card), `app/LoadMore.jsx` (client button), `app/page.jsx`.
- **Cache safety:** cache keys are the function arguments, so every argument comes from a small validated set: offset must be an integer, a multiple of 50 and ≤ 2000 (otherwise 400 `invalid offset`); category is checked against existing slugs; language must be two letters. Cached with tag `"videos"`, so admin writes invalidate it. Response header `s-maxage=60, stale-while-revalidate=300`.
- **Ordering:** `addedAt desc, id desc` (stable tie-break) and the client de-duplicates by id, so a video added mid-session can't appear twice.
- **Errors:** a failed fetch shows "Could not load more stories — please try again." and the button stays usable.
- **Hero** still links straight to YouTube (unchanged).

**Testing:** local browser test 50 → 100 → 130 unique cards on desktop and mobile; API pages 50/50/30; bad offsets return 400. **Live (after deploy):** homepage shows 50 cards + button; clicking appended further cards; `/api/feed?offset=7` and `offset=50` confirmed by the owner in a browser.

**Follow-ups (optional):** infinite scroll instead of a button; hero is not de-duplicated when a filter is active (by design — filtered views show every match).

### Place backfill for existing videos — built, parked (2026-10-11)

New Admin → **Places** page. "Find places" scans videos with a blank Place (up to 500), asks YouTube for each one's recording location, title and description (~5 quota units total at 50 ids per call), and lists suggestions from the same `suggestPlace` logic used when adding a video. The admin edits or unticks rows and clicks Save; nothing is written during the scan.

- **Files:** `lib/youtube.js` (adds `suggestPlacesForVideos`), `app/admin/AdminNav.jsx` ("Places" link), `app/admin/place-suggestions/page.jsx`, `app/api/admin/suggest-places/route.js` (scan, read-only), `app/api/admin/suggest-places/apply/route.js` (save).
- **Safety:** save only fills videos whose Place is still empty (so a hand-typed place is never overwritten), trims, skips blanks, caps at 100 chars and 500 items, then `revalidateTag("videos")`. A YouTube error aborts the scan instead of looking like "no places found".
- **Caveat:** the first place mentioned in the title wins, so titles naming two places can suggest the wrong one; videos with no place in the text are left for manual entry. Not yet tested against the live database. No schema change.
- **Status:** not pushed. To resume, copy the zip's files into the repo and push.

## 🌐 SEO & Discoverability Review — 2026-10-11

A second look at how the site gets found, after video pages shipped. Checked live: `robots.txt`, `sitemap.xml`, one video page, the About page, and what a web search returns. **Not checked:** Google Search Console / Bing Webmaster data (indexed-page counts, queries, errors) — I have no access to it.

### Current state

- [x] **Crawling:** `robots.txt` allows `/`, blocks `/admin` and `/api/`, and links the sitemap.
- [x] **Sitemap:** 258 URLs — homepage, `/about`, `/suggest`, 21 `?category=` URLs, 234 video pages (with `lastmod`).
- [x] **Video pages:** unique title, description, canonical, OG/Twitter tags, H1, related stories, category links. JSON-LD `VideoObject` is in the code but could not be confirmed by the page reader (it strips scripts) — verify one page in Google's Rich Results Test.
- [x] **About page:** states editorial standards and a contact address (`contact@peoplelens.in`).
- Web search for `site:peoplelens.in` and for the site with "independent journalism India" returned nothing from the site. Inconclusive (the search tool does not support `site:`), but consistent with a very young site with almost no inbound links.

### Gaps, in priority order

- [ ] **Backlinks / off-site presence — the biggest lever, not a code task.** Tell the featured channels, PARI-style independent-journalism sites, media-watch accounts and newsletters; post in relevant communities; set up X/Instagram/YouTube profiles for PeopleLens and link them from the site; share new stories tagging the original channels.
- [ ] **Search Console checks (no code):** Pages report to see how many of the 258 URLs are indexed and why others are not; resubmit the sitemap; do the same in Bing Webmaster Tools.
- [ ] **Thin video pages.** A page with only title, byline, embed and related links (no curator note) is weak content. Fill "Why this matters" (2–3 sentences) starting with the newest and most topical videos.
- [ ] **Channel pages** (e.g. a page for "Sharad Sharma on Ground") and real `/category/[slug]` routes replacing `?category=`. People search by channel and topic; these pages also give internal links and richer sitemap entries. Recommended next code item.
- [ ] **Larger social preview image** for video pages — currently YouTube's 480×360 `hqdefault`; use `maxresdefault` where available or a branded 1200×630 card with the headline.
- [ ] **About page does not name who runs the site.** Add a person or organisation line — a trust signal for a news-adjacent site.
- [ ] **Hindi site chrome and Hindi About page** (already parked) — currently only titles are Hindi.
- [x] **Parked, relevant to discovery:** on-site search, footer, category label and absolute date on cards. All done 2026-10-28.

### Context carried over

- The name "PeopleLens" collides with Microsoft Research's project and peoplelens.ai (see Discoverability Review, 2026-08-25), so optimise for topics (India, ground reporting, beats, channels) rather than the brand name.

## 🔗 Hero Card Opened YouTube Directly — 2026-10-22

**Found by the owner while using the app.** The featured (hero) card on the homepage still linked straight to `youtube.com/watch?v=…` (new tab), while every other card opened `/video/<id>`. Cause: when video pages and Load more were built, the grid cards were switched to the video page but the hero was left unchanged and only noted as such — an oversight. Effect: the most prominent story skipped the curator's note, related stories and the on-site page.

**Fix:** `FeaturedCard` in `app/page.jsx` is now a `next/link` `Link` to `/video/<youtubeVideoId>` (same tab); the button label changed from "Watch on YouTube →" to "Read & watch →". No other change.

**Verified:** owner confirmed on the live portal that the hero now opens the video page.

## ▦ Blank Cells in the Last Row of the Homepage Grid — 2026-10-22

**Found by the owner (screenshot):** after the first page of stories the last row was half empty on desktop.

**Cause:** the page size was 50. The desktop grid has 4 columns and the featured card occupies a 2×2 block (4 cells), so 50 cards + hero = 54 cells = 13 full rows + 2 empty cells. Later pages of 50 would have left the same gap at the end.

**Fix:** `PAGE_SIZE` in `lib/feed.js` changed from 50 to **48** (a multiple of 4 and even, for the 2-column mobile grid). With the hero: 48 + 4 = 52 cells = 13 rows; without it (category views) and for every later page: 48 = 12 rows. The page, `LoadMore` and `/api/feed` all read the constant, so nothing else changed; offsets are now multiples of 48. (This supersedes the "50 first, +50 per click" wording in the Load more section above.) The final, partial batch of the catalogue can still end mid-row — unavoidable.

**Verified:** owner confirmed on the live portal that the last row now fills correctly.

## 🛡️ Next.js Security Re-check — 2026-10-22

Re-checked the advisories after the owner asked whether the upgrade is really important. A new **out-of-band release on 14 Oct 2026 (Next.js 16.4.1 / 15.5.28)** fixes three issues; 16.3.8 (the earlier target) does **not** include them, so the upgrade target is now **16.4.1**.

| Issue | Severity | Applies here? |
|---|---|---|
| RCE in `use cache` functions returning typed arrays (GHSA-673q-mjm6-r5xr) | Critical | **No** — needs Cache Components; `next.config.mjs` does not enable it (this app uses `unstable_cache`). |
| RCE via `sharp` processing untrusted SVGs (CVE-2026-96889) | Critical | **Very unlikely** — needs untrusted SVGs on glibc Linux; no `dangerouslyAllowSVG`; images are YouTube JPEGs; the share image is a static PNG (no `ImageResponse`). |
| DoS in App Router apps with a Server Action (GHSA-p3m5-59mp-jv5r) | High | **Believed no** — the admin uses API routes, not Server Actions (not confirmed by a full-codebase search). |

- No public exploitation of these three as of 15 Oct per the sources read. The sources do not state whether Vercel-hosted apps are affected, so the assessment rests on this app's own configuration.
- `next.config.mjs` top-level options are only `images` (with `remotePatterns` for i.ytimg.com, yt3.ggpht.com, yt3.googleusercontent.com) and `headers`.
- Recommendation: upgrade to 16.4.1 within a week or two after a local build test (it is a bigger jump than 16.3.8); not an emergency.
- Sources: Netlify changelog 2026-10-14; The Hacker News (Oct 2026); vercel/next.js security advisories.

## 🧰 Development Moved to Claude Code — 2026-10-27

Development now continues in Claude Code (desktop app, Code tab, Local environment) opened on `D:\Projects\ground-report`, replacing the earlier flow of zipped files copied by hand. A `CLAUDE.md` at the repo root carries the stack, architecture rules, working agreements and the parked list, so each session starts with that context.

**Setup findings**
- The first local `npm run build` failed while prerendering `/sitemap.xml`: `POSTGRES_PRISMA_URL` was not defined in the local `.env`. The code reads **`POSTGRES_PRISMA_URL`** (pooled connection, port 6543, `?pgbouncer=true`) and **`POSTGRES_URL_NON_POOLING`** (direct connection, port 5432), plus `YOUTUBE_API_KEY` and `ADMIN_PASSWORD` (`prisma/schema.prisma`, `lib/youtube.js`, `proxy.js`). These match the names Vercel's Supabase integration creates.
- **`.env.example` and the README still say `DATABASE_URL` — outdated.** Update them to the four names above (names only, no values).
- The pooled user must be `postgres.<project-ref>`; the live project is `ground-report` (Mumbai, `ap-south-1`). The paused Tokyo project "GroundReport" is a different, unused project.
- The next error was "authentication failed": the local password was not the live database password. The database password was **reset in Supabase**, the new connection strings were set in Vercel for `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`, the site was redeployed, and the same values were put in the local `.env`.
- Vercel hides "sensitive" variable values after saving, so they cannot be read back; copy connection strings from Supabase (Connect) instead.
- The database password and `ADMIN_PASSWORD` are separate values.

**Verified:** live homepage and a previously unopened video page load on the new credentials; admin works (owner-tested); the local `npm run build` now passes (23 pages, sitemap included).

**Follow-ups**
- [x] Fix `.env.example` and README variable names (done 2026-10-27).
- [x] (done 2026-10-27, all `_old` files removed) Remove or ignore the old backup files in the repo root (`ISSUES_old2.md`, `ISSUES_old3.md`, `next.config.mjs_old`, `package_old.json`) if they are committed.
- [x] Push `CLAUDE.md` (corrected variable names) to `main` (done).
- [ ] Keep the database password in a password manager.

## 🩺 Portal Health Check — 2026-10-27

Quick check of the live site after the credentials fix.

**Live site (www.peoplelens.in)**
- `/`, `/about`, `/suggest`, `/sitemap.xml`, `/robots.txt`, a video page: 200. `/api/feed?offset=0`: 200 with current data (newest video 2026-10-26).
- `/api/feed?offset=7` (not a multiple of `PAGE_SIZE`): 400. Unknown video id: 404. Both as intended.
- `/admin` → 307 to `/admin/login`; `/api/admin/stats` without the cookie: 401.
- `peoplelens.in/about?x=1` → 308 to `www`, query string kept.
- CSP, HSTS and `X-Frame-Options: DENY` present.

**Vercel (read from the dashboard by the owner):** Node.js Version is 24.x; Logs filtered to Errors over the last 24 hours were empty. The Vercel connector in Claude Code gets 403 on this project's deployments and logs, so these checks need the dashboard (or a re-authorised connector).

**Build:** local `npm run build` passes (23 pages).

**Open observation:** the first request to an uncached page took about 6 seconds (homepage, `/api/feed`, a video page) and about 0.2–0.5 s afterwards. Probably cache misses after invalidation or a cold function on Hobby; not investigated.
- [x] Look into the ~6 s cold-cache first load (investigated and partly fixed 2026-10-27, see "Homepage Speed" below).
- [ ] Optionally add `"engines": { "node": ">=22" }` to `package.json` so the Node version is pinned in the repo (not done).

## ⚡ Homepage Speed — 2026-10-27

Investigated the ~6 s first load of uncached pages. Pushed as `b3d3b61`.

**Findings**
- Response header `X-Vercel-Id` showed `bom1::iad1`: edge in Mumbai, but the page function ran in Virginia (`iad1`, Vercel's default) while the Supabase database is in Mumbai (`ap-south-1`). Every cache-miss query and each new database connection crossed continents.
- The homepage is dynamic (it reads `searchParams` for `?category=`), so it runs a function on every visit and is served `Cache-Control: private, no-store`; the edge can never cache it.
- `getCategories()`, `getHero()` and `getFeedPage()` were awaited one after another.
- All 49 `<img>` tags loaded eagerly (none lazy); the hero uses `maxresdefault.jpg` with no priority hint.
- Four Google font families are pulled in via CSS `@import` (`app/globals.css`), a render-blocking chain.

**Shipped**
- `vercel.json` pins functions to `bom1` (Hobby allows one region).
- `app/page.jsx`: `getCategories()` and `getHero()` now run in parallel (`getHero` takes no arguments, so the cache key set stays bounded).
- `app/StoryCard.jsx`: `loading="lazy"` and `decoding="async"` on grid thumbnails; hero image gets `fetchPriority="high"`.

**Result (live):** `X-Vercel-Id` is now `bom1::bom1`. First request to the homepage 1.5 s (was about 6 s). Follow-up samples the same day: homepage after ~7 idle minutes 0.32 s, `/?category=x` 0.23 s, eight first-time video pages 0.17–0.24 s each (all `bom1::bom1`), so the 1.5 s looks like an outlier; an idle gap of an hour or more was not tested. Repeat requests still about 0.43 s to first byte, so the warm cost is the dynamic render, not the region. Local build passed (23 pages).

**Next steps**
- [ ] Make the homepage static by moving filtering to real `/category/[slug]` routes (already parked as roadmap Tier 1); it could then be served from the edge in roughly 50 ms. Biggest remaining win.
- [x] Self-host the fonts and drop `fonts.googleapis.com` from the CSP. Done 2026-10-30 (self-hosted `@font-face` files rather than `next/font`, see "Fonts and Hero Image" at the end of this file).
- [x] Consider a smaller hero image than `maxresdefault.jpg`. Done 2026-10-30 (optimized WebP through the Next.js image optimizer).
- [x] Take a few more cold-load samples (done 2026-10-27, see Result above). Optional: re-test after a much longer idle gap; Vercel runtime logs would help (the Claude Code connector gets 403 on this project).

## 🧹 Clean-up — outside the repo, parked (2026-10-28)

Repo clean-up is done (27 `_old` backups, two unused icons and `/api/videos` removed; env var names fixed in README and `.env.example`). These items sit outside the repo and are **parked by the owner for later review**:
- [ ] Review the paused duplicate Supabase project "GroundReport" (Tokyo) and delete it if unused (also listed under "Still open").
- [ ] In the Vercel dashboard (Settings → Environment Variables), check for a leftover `DATABASE_URL`; the code reads only `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `YOUTUBE_API_KEY` and `ADMIN_PASSWORD`. The Claude Code connector cannot see this project, so this needs a manual check.
- [ ] Optional: add a `.gitattributes` (for example `* text=auto`) to silence Git's "LF will be replaced by CRLF" warnings on Windows.

## 🔎 On-site Search — 2026-10-28

Shipped as `c46a410`. Roadmap Tier 1 search item.

**What it is**
- A search row above the category pills on the homepage (owner picked mockup option B over a masthead box and a masthead icon), and a `/search?q=` results page that reuses `StoryCard`. Plain GET form: no client JavaScript, no CSP change.
- `lib/search.js`: Postgres full-text search with the `simple` config (no stemming; keeps whole Devanagari words intact, checked against the live database). Each word is a prefix match. Weights: title, then place and category names, then channel, then curator's note. Published videos only, top 24.
- No database change: the vectors are computed at query time over about 250 rows. Add a stored `tsvector` column and a GIN index if the library grows past roughly 10,000 videos.
- Not wrapped in `unstable_cache` on purpose (the key would be free text). Input is cleaned instead: 60 characters, 5 words, only letters, combining marks and digits, passed as one bound parameter. Queries are not stored or logged. The results page is `noindex, follow`.

**Checked live:** `सच` 8 stories, `bihar` 3, `bihar police` 2, `2026` 1, nonsense gives a clean "No stories", empty, `' OR 1=1 --`, and a 300-character query all return a normal page. Function runs in `bom1`; results in 0.2–0.9 s on the first calls.

**Known limits and follow-ups**
- [ ] Romanized Hindi ("bhrashtachar") does not match Devanagari titles; needs transliteration or an alias list.
- [ ] Spelling variants (chandrabindu vs anusvara, nukta) and typos do not match; `pg_trgm` (available, not installed) could add typo tolerance.
- [ ] No live suggestions while typing (would need an API route and client code).
- [ ] If search abuse ever shows up: edge-cache through a route handler with `s-maxage`, or fold it into the parked rate-limit consolidation.

## 🏷️ Card Labels, Dates and Footer — 2026-10-28

Shipped as `96ad784`. Roadmap Tier 1 item "category label + absolute date on cards, and the footer".

**Cards (owner first picked mockup option 2, a thumbnail chip, which shipped as `96ad784`, then switched to option 1 the same day: a red category label above the title)**
- A small red mono category label sits above the title (`.card-eyebrow`); the meta line now shows the channel and an absolute date (`26 Oct 2026`, fixed to India time so server and "Load more" renders agree). Applies to the homepage grid, "Load more" and search results. The featured card was left unchanged at first (it kept "3 days ago"); it was brought in line afterwards, see the last list below.
- Label rule: the video's category with the most videos overall (`lib/feed.js` orders the relation by category video count and takes 1; `lib/search.js` does the same in SQL). No database change. `getFeedPage` returns a flat `categoryName` instead of the relation.
- Observation: this rule gives "Corruption" on 19 of the first 48 cards and "Protest & Rights" on 15, so the labels are lopsided. Option if it bothers readers: use the video's least common category, at the cost of the label varying more.

**Footer (owner picked F3, centered)**
- `app/Footer.jsx` in the shared layout: About and Suggest a video links, "Every video belongs to its creator and plays from YouTube. PeopleLens only links to it and adds context.", and "© <year> PeopleLens". The page body is now a full-height flex column, so the footer sits at the bottom on short pages.
- It also appears on admin pages (shared layout); hide it there if it bothers.

**Checked live (for the chip version, before the switch):** chips and dates on the homepage, "Load more" (`/api/feed?offset=48`: 48 of 48 videos have a label), search results, footer on `/`, `/about`, `/suggest`, `/search` and a video page. `/admin` 307, `/api/admin/stats` 401, bad offset 400. Tested on a real phone by the owner on 2026-10-28 (footer, card labels and dates, featured card, search): all looked good.
- [x] Featured card now gets the category label above the title and the absolute date too (owner picked mockup H1, 2026-10-28). `getHero` in `lib/feed.js` fetches the same most-used category and returns a flat `categoryName`; `FeaturedCard` in `app/page.jsx` shows it with `formatDate`. Note: the featured video's label comes from the same rule as the grid, so it can look off for a hand-picked story (the current one reads "Protest & Rights" for an E20 fuel story).
- [ ] Decide whether the label rule (most-used category) should change.

## 🧭 Header: Strapline and Search Pill — 2026-10-28

Goal: give the stories more room at the top of the landing page (about 285 px of header before the first story row).

**Shipped (commits `6fbc3a2`, `400b14a`, `f4598d1`)**
- Strapline moved under the PEOPLELENS wordmark in the blue bar on public pages. First as "Community suggested | Picked by hand | Not by algorithm" (`6fbc3a2`). After the owner's feedback that it crowded the search pill, shortened to "Picked by hand · Not by algorithm" (`f4598d1`; "Community suggested" dropped). One line from 768 px up; on phones the two phrases stack on two lines (`.masthead-strap` spans). The old phone-only copy in the homepage body is gone.
- Search moved into the bar as a rounded light pill (owner liked it in mockup option M1): magnifier icon, placeholder, a "/" hint chip, and a working "/" keyboard shortcut (`MastheadBar.jsx`, a small client effect). Plain GET form to `/search`, so Enter works without JavaScript. At 1024 px and up the bar is a three-column grid (`1fr 400px 1fr`) so the pill sits at the true centre; below that (phones and tablets) the bar shows just a search icon that opens `/search`. The old full-width search row on the homepage is gone. "About" stays in the phone bar (checked at 375 and 360 px).
- Search (pill, "/" shortcut and phone icon) shows on the home page only, `/` and its `?category=` views (`pathname === "/"`). About, Suggest, video pages and `/search` have none; `/search` keeps its own box.
- An earlier version (search box with a Search button, About hidden on phones) was built and reverted before it was committed.

**Checked live (`f4598d1`):** pill and icon markup on `/` and `/?category=corruption` only, none on `/about`, `/suggest`, `/search` or a video page, the new strapline spans everywhere, the old copy gone, and the usual routes behave (admin pages have no search or strapline in the bar).

**Phone follow-ups (owner feedback after reviewing on a phone)**
- Tapping the phone search icon used to open a bare `/search` page, so the stories vanished. Now (`d6f3cc1`, mockup option S1) it opens a search box that drops down under the bar on the home page and pushes the stories down instead of replacing them. Close with the X, Esc, the icon again, or a page change; Enter goes to `/search?q=`. The icon still links to `/search` without JavaScript or on a modified click. 16 px input text so iOS does not zoom.
- The strapline was on two lines on phones. Now (`e21e230`, mockup option P3) it is one line (10 px) in its own row under the top row of the bar; the logo, search icon, About and "+ Suggest" stay together in the top row. Phone bar padding trimmed (`py-3 md:py-4`); the bar is about 81 px at 375 px, down from about 90 px. Considered and not chosen: About leaving the phone bar (P1), a menu icon (P2), Suggest as a red plus (P4).
- Checked live (`e21e230`): the strapline markup (desktop and phone row) is on every public page, and the production stylesheet has the row and drop-down styles. The layout and the drop-down were verified locally at 375 and 360 px, and the owner checked the earlier phone versions on a real phone. Not yet seen on a phone for `e21e230`.

**Category label (2026-10-28, `03877c9`)**
- The small "CATEGORY" caption above the pills was removed from view: the chips explain themselves ("All" highlighted, plain category names, "More (13)") and it cost about 18 px of height. It stays in the markup as a visually hidden `<h2 class="sr-only">Category</h2>` so screen readers keep the section heading. Checked live (the hidden heading is present, the visible one is gone) and tested on a phone by the owner: fine.

**Parked / open (owner reviewing)**
- [x] Shorten the date and headline line (mockup options D1 headline left plus short date right, D2 headline only, D3 date inline). **Decided 2026-10-30: D1.** The headline is on the left and the short date ("Fri, 30 Oct 2026", built from `Intl` parts because the en-IN format adds a comma after the month) on the right of one line (`app/page.jsx`); on a phone the date wraps under the headline, which saves little there. About 30 px saved on desktop. (The owner flipped between D1 and "leave as is" while this was being built; the last choice, D1, is what shipped.) The "Category" label above the pills was hidden separately (see "Category label").
- [ ] Modern header directions M1 (light bar), M2 (search-first blue band), M3 (ribbon plus underline tabs) were mocked up on a design canvas (https://claude.ai/artifact/4ReLzXj9QPE9SHfXqM1yM6, private). Only M1's search pill was taken so far; the rest is parked.
- [x] The `/search` results page showed its own large search box under the bar's pill on wide screens. No longer an issue: since the bar's pill and icon appear on the home page only (`f4598d1`), `/search` has just its own box, which is kept (it is prefilled with the query and is the only way to refine a search from the results page).
- [ ] **Parked (owner, 2026-10-28):** `/search` with no query shows only the box and a hint, so it looks empty (for example when opened from a typed address). Idea: fill that case with the category chips and the latest stories (mockup option S3 from the phone search options). Small; not started.

## ⬆️ Next.js 16.4.1 Upgrade — 2026-10-28

Parked item from the 2026-10-22 security re-check, done on request.

**Changes:** `next` pinned exactly to `16.4.1` (`npm install next@16.4.1 --save-exact`); `package-lock.json` updated (Next's own platform packages, two optional `sharp` wasm packages added, a nested `postcss` removed). React stays on 18 (16.4.1 still accepts `^18.2.0`). Nothing in the app code changed.

**Verified locally on 16.4.1 (before pushing):**
- `npm run build` passes, 24 pages.
- Smoke test against `next start`: `/`, `?category=` views (a bad category falls back to the full feed), `/about`, `/suggest`, `/search` (English and Hindi queries), a video page (an unknown id is 404), sitemap, robots, OG image, `/admin` 307, `/admin/login`, `/api/admin/stats` 401, `/api/feed` (offset 0 and 48; a bad offset is 400). Security headers (CSP, X-Frame-Options, nosniff) intact.
- Browser check: desktop home page renders; at phone width the search icon opens and closes the drop-down box (focus lands in the input), no horizontal overflow, no console errors, all images load.

**New warning:** the build now prints "React 18 support is deprecated in Next.js 16 and will be removed in Next.js 17. Please upgrade to React 19." Nothing breaks on 16.x.
- [ ] Plan a React 19 upgrade before moving to Next.js 17 (check `react`, `react-dom` and anything depending on them; run a local build and the same smoke test).

**Left alone:** `npm audit` reports 4 findings (2 moderate, 2 high) in other packages (for example `source-map-js`); unrelated to this upgrade. `npm audit fix` can move minor versions (it did once before), so any fix should be reviewed first.
- [ ] Review the `npm audit` findings and fix them deliberately (not with a blind `audit fix`).

## 📌 Admin Hint When Nothing Is Featured — 2026-10-28

Closes the old "No featured video — silent empty state" known issue.

- `app/page.jsx`: when no published video is marked featured, a dashed red note ("ADMIN ONLY · No featured story set. Go to Admin to pin one.") appears above the grid, **only for a signed-in admin** (the `admin_session` cookie equals `ADMIN_PASSWORD`, the same check as `proxy.js`) and **only on the unfiltered homepage** (category and language views never show a hero, so no hint there). Visitors see no change.
- Reading the cookie does not change caching: the page was already dynamic (it reads `searchParams`) and the data still comes from the `unstable_cache` queries.
- Tested locally with a temporary switch that forced "no featured": visitor sees no hint, a valid admin cookie sees it, a wrong cookie does not, the category view does not; desktop and phone screenshots looked right. The switch was removed before committing, and with the real data (a featured video exists) neither a visitor nor an admin sees the hint.
- Not testable live without un-featuring the current video (production data; not touched).

**Follow-up (2026-10-28, same day)**
- Owner confirmed the homepage hint live on `www.peoplelens.in`. Gotcha learned while testing: the admin login cookie is **per hostname**. Logging in at `ground-report-sable.vercel.app` does not log you in at `www.peoplelens.in`, so the hint (and every admin page) only works on the host where you signed in. If the hint seems missing, open `/admin` on that same host; if it redirects to the login page, sign in there.
- The same hint was added to the Admin page (`app/admin/page.jsx`, a client component): a dashed red note above the video list when no video is both featured and published, with a second wording when the featured video exists but is hidden ("Publish it, or set another video as featured"). A hidden featured video also leaves the homepage without a hero, which the first version of the check did not distinguish. Previewed by mockup; the Admin page is behind the login cookie, so it was verified by build only, not by browsing it locally.

## ♿ Design Critique: Suggest Form and Accessibility Fixes — 2026-10-29

From a design critique of the live site (home on desktop and phone, a video page, the Suggest form). Priorities 1 and 2 were done; the rest is listed below.

**Done**
- Suggest form (`app/suggest/page.jsx`): each visible label is now linked to its field (`htmlFor`/`id`), so screen readers get a name instead of only the placeholder; the "A channel / A specific video" buttons carry `aria-pressed`; the contact field gets `inputMode="email"` and `autoComplete="email"` (email keyboard on phones) but stays `type="text"` on purpose, since it has always accepted any contact (a phone number, a handle) and `type="email"` would reject those.
- Phones: `.input` is 16 px below 768 px (14 px made iPhones zoom the page when a field took focus). Desktop stays 14 px. Admin forms share `.input`, so they get 16 px on phones too.
- Header contrast: the strapline and the About link were partly transparent white (about 4.2:1 on the blue bar at 10 px, under 4.5:1); both are now full white.
- Keyboard focus: the site's red focus ring was almost invisible on the blue bar (about 1.2:1); inside `.masthead` the ring is now white.
- New "Skip to content" link (first Tab stop, visible only when focused) to `<main id="main">`.
- Phone tap targets: About (20 px tall), "+ Suggest" (28 px) and the search icon (36 px) now have invisible extended tap areas of at least 44 px (an `::after` box; the 12 px gap between them keeps the areas from overlapping). The header looks the same and is still 81 px tall.

**Verified locally:** build passes; on a phone-width view the fields are 16 px, labelled and the email keyboard hint is set; Tab shows the skip link first, then white rings on the search box and the Suggest button; tap areas measured 46×44 (About), 98×52 (Suggest), 46×60 (search icon); no horizontal overflow.

**Still open from the critique**
- [ ] Channel pages and category routes: the video page's "Channel →" leaves for YouTube while the card beside it says "N stories on PeopleLens".
- [x] Strip trailing hashtags from displayed titles, and absolute dates in "Related stories" like the grid: done 2026-10-30 (owner picked mockup option 2), see "Video Page Polish" at the end of this file.
- [ ] Video pages are thin without a "why this matters" note (content work for the owner; the curator note field already exists in Admin).
- [x] Raise the 10–11 px mono text: done 2026-10-29 for the card category label and the channel/date line (now 11 px; the strapline stays 10 px). See "Card Text Size and Language Tag" below.
- [x] Language cue on cards: done 2026-10-29 (owner picked mockup B: a small outlined "HI"/"EN" tag at the right of the category row).
- [ ] The parked Hindi site chrome (the interface text is still English only).

## 🏷️ Card Text Size and Language Tag — 2026-10-29

From the design critique, owner picked mockup B.

- Category label and the channel/date line on cards are now 11 px (were 10 px). The strapline stays 10 px.
- A small outlined language tag ("HI" or "EN", from the stored `language` field, which is `hi` for 206 videos, `en` for 47 and empty for 1) sits at the right of the category row on grid cards, search results and the featured card. A video with no language shows no tag. The tag has a hidden "Language: Hindi/English" label for screen readers and a hover title.
- Code: `CardLabel` (exported from `app/StoryCard.jsx`) is shared by the grid and the featured card; `language` is now selected in `getFeedPage` (`lib/feed.js`) and in the search SQL (`lib/search.js`); `getHero` already returned the whole row. Styles: `.card-label-row`, `.card-eyebrow`, `.card-lang` in `app/globals.css`.
- Phones: the two-column cards have only about 150 px for text, so below 768 px the label row uses tighter letter-spacing and gap; with that, none of the 7 category labels in the first 48 cards is truncated (a longer category name still would be, with the full name in the hover title).
- Checked locally on desktop and at 375 px (no overflow, 11 px label and date, the tag on every card). The featured card was not visible locally because no video is featured right now; it uses the same `CardLabel`.

## 🗂️ Channel and Category Pages: plan, parked (2026-10-30)

Owner reviewed the plan and mockups and **parked** it for now. Nothing is built. Resume from here.

**Scope**
- `/channel/<slug>` page: channel avatar and name, "N stories on PeopleLens", "Watch channel on YouTube", category chips to filter within the channel, story grid and "Load more".
- `/category/<slug>` page: H1 and story count, the same chips with the current one active, the grid and "Load more" (the existing feed filtered by category).
- Links: channel name on cards and the video page's "Channel →" go to `/channel/…` (the video page currently sends people to YouTube while saying "N stories on PeopleLens"); category labels, video tags and the home chips go to `/category/…`; old `/?category=<slug>` links get a permanent (308) redirect to `/category/<slug>`.
- SEO: per-page title, description and canonical; sitemap entries for every channel and category; the pages people search for (by channel and by topic).

**Rules it must follow**
- Use the cached queries tagged `"videos"` (admin routes already revalidate them). An unknown channel or category must throw inside the cached function so made-up URLs cannot create cache entries. Keep `/api/feed` offsets as multiples of `PAGE_SIZE` (max 2000); add a validated `channel` parameter for "Load more" on channel pages.

**Open decision: how a channel appears in the URL**
- Readable slug (`/channel/doublecheck-by-sanket-upadhyay`), better for search: needs one owner-run SQL step before the deploy (add a `slug` column to `Channel`, fill it for the 66 channels, add a unique index; fall back to the id when a name has no Latin letters). Recommended.
- YouTube channel id (`/channel/UC9x…`): no database change; ugly URLs; slugs can be added later with redirects.

**Later, separate step:** the homepage reads the admin cookie (for the "no featured story" hint), so it renders on every visit. Moving that hint into a small client-side piece would let the homepage be static (about 50 ms instead of about 0.4 s).

**Risks:** the slug SQL has to run before the code deploys, otherwise channel pages fail; test locally against real data and show screenshots before pushing.

## 🔤 Fonts and Hero Image — 2026-10-30

Finishes the homepage-speed work. Owner chose: do both, and trim the 500 weights.

**Fonts (self-hosted)**
- Before: `app/globals.css` started with an `@import` of Google Fonts, so every page waited for the CSS from `fonts.googleapis.com`, then the font files from `fonts.gstatic.com`: 46 `@font-face` rules and 31 files in the stylesheet; a Hindi reader downloaded 13 files, about 497 KB.
- Now: 8 font files (284 KB in total, all unicode ranges) live in `public/fonts/`, fetched once from Google Fonts (IBM Plex and Archivo Narrow are OFL-licensed), with the rules in `app/fonts.css` (imported first in `app/layout.jsx`) and the `@import` removed. I used plain `@font-face` instead of `next/font` on purpose: the CSS and inline styles all name the families literally ("IBM Plex Sans", "Archivo Narrow" ...), and `next/font` renames them to generated names.
- Weights kept: Archivo Narrow 700; IBM Plex Sans 400 and 600; IBM Plex Sans Devanagari 400 and 600; IBM Plex Mono 400. Dropped: Archivo Narrow 600, Plex Sans 500, Devanagari 500, Mono 500 (nothing used them, except `.btn` and one admin label, which went from 500 to 600; the admin hint's `<strong>` became a 600 span so it does not get a fake bold).
- The Latin files are variable fonts, so one file serves both Plex Sans weights. `unicode-range` makes the browser fetch only the files a page needs. The four files every page needs are preloaded (Plex Sans Latin, Archivo Narrow Latin, Plex Mono Latin, Devanagari 600, since most titles are Hindi). `Cache-Control: public, max-age=31536000, immutable` on `/fonts/*` in `next.config.mjs`: **a changed font must get a new file name.**
- CSP: removed `https://fonts.googleapis.com` from `style-src` and `https://fonts.gstatic.com` from `font-src`.
- Measured locally: the home page requests 4 font files, 151 KB in total, none from another host (about 497 KB before for the same Hindi page).
- To add a weight or family later: download the woff2 into `public/fonts/`, add an `@font-face` block to `app/fonts.css`, and preload it only if every page needs it.

**Hero image**
- The featured card used YouTube's 1280x720 JPEG (about 217 KB). `app/HeroImage.jsx` (client component) now serves it through the Next.js image optimizer (`next/image`, quality 75, `sizes="(min-width: 1024px) 560px, 100vw"`, eager, high priority): a WebP of about 24 KB on desktop and 31 KB at 375 px, measured locally. Measured sizes at other widths for the same image: 640 px 24 KB, 828 px 35 KB, 1080 px 53 KB, 1200 px 64 KB.
- Only the hero goes through the optimizer (one source image at a time), so the free plan's limit of 1,000 source images a month is not a concern; the 48 grid thumbnails are untouched. `images.minimumCacheTTL` is 30 days.
- Fallback: if a video has no `maxresdefault` thumbnail (the optimizer returns 404 for a missing one, checked with a made-up id), the component switches to `hqdefault` (4:3 with black bars, cropped away by `object-cover`). The fallback was reasoned out and the 404 confirmed, but not seen on screen.

## 🎬 Video Page Polish — 2026-10-30

From the design critique; owner picked mockup option 2.

- **Hashtags:** `displayTitle()` in the new `lib/title.js` strips a trailing run of hashtags ("... Explanation! #gyaneshkumar #eci" becomes "... Explanation!"); a title that is only hashtags stays as it is. It is used wherever a title is shown: `StoryCard` (grid, search, related), the featured card, the video page heading, its iframe `title`, the browser tab title and the Open Graph and Twitter titles. The stored title is untouched and the VideoObject JSON-LD keeps the original. Only 4 of 255 published titles end in hashtags (checked in the database), all of them trailing, none mid-title.
- **Related stories** on the video page now render the same `StoryCard` as the home grid: category label, HI/EN tag, absolute date ("29 Oct 2026") instead of "today" / "1 day ago". Their query uses the new shared `CARD_SELECT` and `toCardVideo` exported from `lib/feed.js` (also used by `getFeedPage`), so the grid, search and related cards read the same fields. The video page's own `timeAgo` and `formatDate` copies were removed; it uses the shared `formatDate` from `StoryCard`.
- Checked locally: heading and `<title>` and `og:title` have no hashtags, the JSON-LD still has the original; the related cards show label, language tag and absolute dates on desktop and at 375 px (two columns, no truncated labels, no overflow); the other routes still return 200.

## 🔐 Admin Security Polish — 2026-10-31

From the earlier review of the admin API (the items under "Security" in the known issues). Owner approved the plan; session length stays 30 days and the signing key is derived from `ADMIN_PASSWORD` (no new setting in Vercel).

- **Signed session cookie.** `lib/session.js` creates and verifies a token `"<expiry>.<HMAC-SHA256>"` with Web Crypto (works in `proxy.js`, route handlers and server components; `crypto.subtle.verify` compares in constant time). The key is `peoplelens-admin-session-v1:` plus `ADMIN_PASSWORD`, so changing the password signs every session out. The `admin_session` cookie no longer contains the password: used by `proxy.js` (now async), `/api/auth/login`, `/api/auth/logout` and the home page's "no featured story" hint. **After this deploy everyone is logged out once** (the old plain-password cookie is rejected) and must sign in again on each hostname.
- **Constant-time password check** at login (SHA-256 digests plus `timingSafeEqual`).
- **Safe JSON bodies.** `lib/http.js` has `readJson()` and `badBody()`; every route that reads a body (login, the admin categories, videos, nominations, YouTube lookups, and the public nominations route) answers `400 {"error":"Invalid request body"}` for malformed, empty or `null` JSON instead of a 500. Fields read from a body are checked to be strings where it mattered.
- **Missing ids.** The two DELETE routes already checked first (the older note was stale) and now also handle a delete race; the real gap was PATCH: updating a missing category, video or nomination threw a database error (500). All three now answer 404. **Found while doing this:** `PATCH /api/admin/videos/<missing id>` with `featured: true` un-featured every other video *before* failing, so it could silently clear the featured story; the video is now looked up first.
- `categoryIds` on a video PATCH must be a list of text ids (400 otherwise).

**Verified locally** (real requests to `next start`, with a token minted by the same code; nothing was written to the database, checked by counting rows before and after): no cookie 401; valid token 200 on `/api/admin/stats` and `/admin`; tampered, expired, garbage and old plain-password cookies all 401 (and `/admin` redirects 307); bad, empty and `null` bodies 400 on all eleven routes; missing ids 404 on PATCH and DELETE; unauthenticated PATCH 401. **Not exercised:** the real login (it writes a rate-limit row to the live database and counts against the owner's IP), so the login path was checked by reading the code; the owner confirms it live by signing in.
