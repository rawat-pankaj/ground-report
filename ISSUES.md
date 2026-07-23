# Ground Report — Issues & Backlog

> Status: `[ ]` open · `[~]` in progress · `[x]` done  
> Update this file and commit alongside code changes to keep it in sync.

---

## 🐛 Known Issues

- [ ] **Featured card empty space** — `row-span-2` forces the hero card taller than its content when adjacent cards have short headlines. Workaround: accepted as-is for now. Fix: remove `row-span-2` from `FeaturedCard` in `app/page.jsx`.
- [ ] **Hindi text at small sizes** — Devanagari script at 13px (regular story cards) can feel cramped on dense titles. Consider bumping `StoryCard` headline to 14px.
- [ ] **Card hover state** — Only the headline turns red on hover. A subtle border darkening or background shift on the card itself would make it feel more clearly clickable.
- [ ] **No featured video — silent empty state** — If no video is marked "featured" in admin, the hero section disappears with no message. Should show an admin-only hint like "No featured story set — go to Admin to pin one."
- [ ] **Vercel Speed Insights PR** — Vercel bot auto-created a PR to add Speed Insights on a separate branch. Not yet merged. Review and merge or close at `github.com/rawat-pankaj/ground-report/pulls`.

---

## ✨ Pending Features

- [ ] **View count display** — DB column `viewCount` already exists (added, defaults to 0). YouTube fetch code written (`lib/youtube.js`, `app/api/admin/videos/route.js`, `app/api/cron/update-views/route.js`). Display on all cards in abbreviated format (1.2M, 45K). Needs: `CRON_SECRET` env var on Vercel + cron-job.org setup pointing to `/api/cron/update-views?secret=YOUR_SECRET`. Daily refresh planned.
- [ ] **Mobile review** — Site not yet tested on a phone. 2-column grid on mobile (featured card full width, regular cards 2-col) needs visual QA especially for Hindi text.
- [ ] **Custom domain** — Not started. Can be added via Vercel dashboard → Domains.
- [ ] **cron-job.org setup** — Needed for daily view count refresh once view counts are enabled. Sign up at cron-job.org, create job pointing to `https://ground-report-sable.vercel.app/api/cron/update-views?secret=CRON_SECRET`, schedule daily.

---

## 💡 Ideas / Backlog

- [ ] **Filter by channel** — Allow users to see all videos from a specific channel by clicking the channel name on a card.
- [ ] **Search** — Basic keyword search across video titles.
- [ ] **"More like this" beat links** — On the featured card, clicking a beat tag could filter the grid to that beat.
- [ ] **Admin: bulk language/tag edit** — Currently tags are edited one video at a time. A bulk-select-and-tag flow would speed up curation.
- [ ] **Admin: sort/filter dashboard** — Admin video list grows long. Filtering by language, beat, or status would help.
- [ ] **Nomination email alert** — When a new suggestion comes in via the public form, send a notification email to the admin.

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

---

*Last updated: 2026-07-23*
